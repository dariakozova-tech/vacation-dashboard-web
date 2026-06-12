import { db } from '@/lib/db';
import { employees, vacationRecords, sageSyncLog, employeeChildren } from '@/lib/db/schema';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { sageGetAll, sageGet } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SageLeaveRequest {
  id: number;
  employee_id: number;
  status_code: string;
  start_date: string;
  end_date: string;
  hours?: number;
  [key: string]: unknown;
}

export interface Discrepancy {
  type: 'in_sage_only' | 'in_dashboard_only' | 'day_count_mismatch';
  employee: string;
  sage_id?: number;
  start_date: string;
  end_date?: string;
  sage_days?: number;
  dashboard_days?: number;
  calendar_days?: number;
}

export interface ImportOptions {
  daysBack?: number; // if set, only fetch last N days instead of full history
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calendarDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function displayStatus(sageStatus: string, isDeel: boolean): string {
  if (isDeel) return sageStatus;
  const map: Record<string, string> = {
    approved: 'Погоджено',
    pending: 'На розгляді',
    declined: 'Відхилено',
  };
  return map[sageStatus.toLowerCase()] ?? sageStatus;
}

// ── Map Sage employees by email + name fallback ─────────────────────────────

export async function mapSageEmployees(): Promise<{
  mapped: number;
  total: number;
  sageEmployees: { id: number; firstName: string; lastName: string; email: string }[];
}> {
  const sageEmployees = await sageGetAll('/employees');
  let mapped = 0;

  // First pass: match by email
  for (const se of sageEmployees) {
    const email = se.email?.toLowerCase().trim();
    if (!email || !se.id) continue;

    const result = await db
      .update(employees)
      .set({ sageEmployeeId: se.id })
      .where(
        and(
          sql`LOWER(TRIM(${employees.email})) = ${email}`,
          isNull(employees.sageEmployeeId)
        )
      )
      .returning();

    if (result.length > 0) mapped++;
  }

  // Second pass: try name matching for still-unmapped employees
  const unmapped = await db
    .select()
    .from(employees)
    .where(and(isNull(employees.sageEmployeeId), eq(employees.isActive, true)));

  for (const emp of unmapped) {
    // Try matching by English name parts
    const nameParts = emp.fullName.toLowerCase().split(' ');
    const match = sageEmployees.find((se: any) => {
      const sageFirst = (se.first_name || '').toLowerCase();
      const sageLast = (se.last_name || '').toLowerCase();
      return nameParts.some((p: string) => p === sageFirst || p === sageLast) &&
        nameParts.some((p: string) => p !== sageFirst && (p === sageLast || p === sageFirst));
    });

    if (match) {
      await db
        .update(employees)
        .set({ sageEmployeeId: match.id })
        .where(eq(employees.id, emp.id));
      mapped++;
      console.log(`  Name-matched: ${emp.fullName} → Sage ID ${match.id} (${match.first_name} ${match.last_name})`);
    }
  }

  return {
    mapped,
    total: sageEmployees.length,
    sageEmployees: sageEmployees.map((se: any) => ({
      id: se.id,
      firstName: se.first_name,
      lastName: se.last_name,
      email: se.email,
    })),
  };
}

// ── Fetch all leave requests in 60-day chunks ───────────────────────────────

const DEFAULT_FROM_DATE = '2023-08-01';

export async function fetchAllLeaveRequests(options?: ImportOptions): Promise<SageLeaveRequest[]> {
  const requests: SageLeaveRequest[] = [];

  let fromDate: string;
  if (options?.daysBack) {
    const d = new Date();
    d.setDate(d.getDate() - options.daysBack);
    fromDate = d.toISOString().split('T')[0];
  } else {
    fromDate = DEFAULT_FROM_DATE;
  }

  let from = new Date(fromDate);
  const today = new Date();

  while (from < today) {
    const to = new Date(from);
    to.setDate(to.getDate() + 60);
    if (to > today) to.setTime(today.getTime());

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    try {
      const data = await sageGetAll(
        `/leave-management/requests?from=${fromStr}&to=${toStr}`
      );
      requests.push(...data);
    } catch (err) {
      console.error(`Sage API error for ${fromStr}–${toStr}:`, err);
    }

    from = new Date(to);
    from.setDate(from.getDate() + 1);
  }

  // Deduplicate by id
  const deduped = [...new Map(requests.map((r) => [r.id, r])).values()];

  // Log count per year
  const byYear: Record<string, number> = {};
  for (const req of deduped) {
    const y = req.start_date?.substring(0, 4) ?? 'unknown';
    byYear[y] = (byYear[y] || 0) + 1;
  }
  console.log('Sage requests by year:', byYear);

  return deduped;
}

// ── Discrepancy report ──────────────────────────────────────────────────────

export async function generateDiscrepancyReport(): Promise<Discrepancy[]> {
  const discrepancies: Discrepancy[] = [];
  const allSageRequests = await fetchAllLeaveRequests();

  const relevant = allSageRequests.filter((r) =>
    ['approved', 'pending'].includes(r.status_code?.toLowerCase())
  );

  const allEmployees = await db.select().from(employees);
  const empBySageId = new Map(
    allEmployees.filter((e) => e.sageEmployeeId).map((e) => [e.sageEmployeeId!, e])
  );

  const allRecords = await db.select().from(vacationRecords);

  for (const req of relevant) {
    const emp = empBySageId.get(req.employee_id);
    if (!emp) continue;

    const calDays = calendarDays(req.start_date, req.end_date);
    const sageDays = req.hours ? Math.round(req.hours / 8) : calDays;

    const existing = allRecords.find(
      (r) =>
        r.employeeId === emp.id &&
        r.startDate === req.start_date &&
        r.recordType === 'period'
    );

    if (!existing) {
      discrepancies.push({
        type: 'in_sage_only',
        employee: emp.fullName,
        sage_id: req.id,
        start_date: req.start_date,
        end_date: req.end_date,
        sage_days: sageDays,
        calendar_days: calDays,
      });
    } else if (Math.abs((existing.daysCount ?? 0) - calDays) > 0) {
      discrepancies.push({
        type: 'day_count_mismatch',
        employee: emp.fullName,
        sage_id: req.id,
        start_date: req.start_date,
        end_date: req.end_date,
        sage_days: sageDays,
        dashboard_days: existing.daysCount ?? undefined,
        calendar_days: calDays,
      });
    }
  }

  // Check for records in dashboard not in Sage
  const manualRecords = allRecords.filter(
    (r) =>
      r.recordType === 'period' &&
      r.startDate &&
      r.startDate >= '2023-08-01' &&
      (r.source === 'manual' || !r.source)
  );

  for (const rec of manualRecords) {
    const emp = allEmployees.find((e) => e.id === rec.employeeId);
    if (!emp || !emp.sageEmployeeId) continue;

    const inSage = allSageRequests.some(
      (r) =>
        r.employee_id === emp.sageEmployeeId &&
        r.start_date === rec.startDate
    );

    if (!inSage) {
      discrepancies.push({
        type: 'in_dashboard_only',
        employee: emp.fullName,
        start_date: rec.startDate!,
        end_date: rec.endDate ?? undefined,
        dashboard_days: rec.daysCount ?? undefined,
      });
    }
  }

  return discrepancies;
}

// ── Import approved & pending records ────────────────────────────────────────

export async function importSageRecords(options?: ImportOptions): Promise<{
  added: number;
  updated: number;
  errors: string[];
  discrepancies: Discrepancy[];
}> {
  const allRequests = await fetchAllLeaveRequests(options);
  let added = 0;
  let updated = 0;
  const errors: string[] = [];

  const allEmployees = await db.select().from(employees);
  const empBySageId = new Map(
    allEmployees.filter((e) => e.sageEmployeeId).map((e) => [e.sageEmployeeId!, e])
  );

  for (const req of allRequests) {
    const status = req.status_code?.toLowerCase();
    if (!['approved', 'pending'].includes(status)) continue;

    const emp = empBySageId.get(req.employee_id);
    if (!emp) continue;

    try {
      const calDays = calendarDays(req.start_date, req.end_date);
      const year = new Date(req.start_date).getFullYear();

      const existing = await db
        .select()
        .from(vacationRecords)
        .where(eq(vacationRecords.sageId, req.id))
        .then((rows) => rows[0]);

      if (existing) {
        await db
          .update(vacationRecords)
          .set({ status, daysCount: calDays })
          .where(eq(vacationRecords.sageId, req.id));
        updated++;
      } else {
        await db.insert(vacationRecords).values({
          employeeId: emp.id,
          recordType: 'period',
          startDate: req.start_date,
          endDate: req.end_date,
          daysCount: calDays,
          year,
          status,
          source: 'sage',
          sageId: req.id,
          vacationType: 'main',
          submittedOnTime: false,
        });
        added++;
      }
    } catch (err) {
      const msg = `Failed to import sage_id=${req.id} for ${emp.fullName}: ${err}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // Log the sync
  const discrepancies = options?.daysBack ? [] : await generateDiscrepancyReport().catch(() => []);
  await db.insert(sageSyncLog).values({
    recordsAdded: added,
    recordsUpdated: updated,
    discrepancies: discrepancies.length > 0 ? (discrepancies as any) : null,
    errors: errors.length > 0 ? (errors as any) : null,
  });

  console.log(`Sage sync: ${added} added, ${updated} updated, ${errors.length} errors`);

  return { added, updated, errors, discrepancies };
}

// ── Verification query ──────────────────────────────────────────────────────

export async function getMappingCoverage() {
  const allActive = await db
    .select()
    .from(employees)
    .where(eq(employees.isActive, true));

  const mapped = allActive.filter((e) => e.sageEmployeeId != null);
  const unmapped = allActive.filter((e) => e.sageEmployeeId == null);

  return {
    mapped: mapped.length,
    unmapped: unmapped.length,
    total: allActive.length,
    unmappedEmployees: unmapped.map((e) => ({
      fullName: e.fullName,
      email: e.email,
    })),
  };
}

// ── Get last sync log ───────────────────────────────────────────────────────

export async function getLastSyncLog() {
  const rows = await db
    .select()
    .from(sageSyncLog)
    .orderBy(sql`${sageSyncLog.syncedAt} DESC`)
    .limit(1);
  return rows[0] ?? null;
}

// ── Sync children from Sage HR ──────────────────────────────────────────

interface SageChild {
  id: number;
  full_name: string;
  relation: string;
  birth_date: string;
  with_needs: boolean;
  due_date: string | null;
  adoption_date: string | null;
  date_of_death: string | null;
}

export async function syncChildrenFromSage(): Promise<{
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}> {
  let added = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Get all employees with sage_employee_id
  const allEmployees = await db
    .select()
    .from(employees)
    .where(isNotNull(employees.sageEmployeeId));

  // Get all existing children to avoid duplicates
  const existingChildren = await db.select().from(employeeChildren);

  for (const emp of allEmployees) {
    const sageId = emp.sageEmployeeId!;

    try {
      const response = await sageGet(`/employees/${sageId}/children`);
      const sageChildren: SageChild[] = response.data ?? [];

      if (sageChildren.length === 0) continue;

      // Find existing children for this employee
      const empChildren = existingChildren.filter(c => c.employeeId === emp.id);

      for (const sc of sageChildren) {
        if (!sc.birth_date) {
          skipped++;
          continue;
        }

        // Match by employee_id + birth_date
        const existing = empChildren.find(c => c.birthDate === sc.birth_date);

        // For non-Deel employees: store English name in notes, leave childName for Ukrainian
        // For Deel employees: use English name directly
        const sageName = sc.full_name?.trim() || null;
        const sageNote = sageName ? `Sage: ${sageName}` : null;

        if (existing) {
          // Update if notes differ (new Sage name) or name was empty and this is Deel
          const needsUpdate =
            (sageNote && existing.notes !== sageNote) ||
            (emp.isDeel && sageName && !existing.childName);

          if (needsUpdate) {
            await db
              .update(employeeChildren)
              .set({
                notes: sageNote ?? existing.notes,
                ...(emp.isDeel && sageName && !existing.childName
                  ? { childName: sageName }
                  : {}),
              })
              .where(eq(employeeChildren.id, existing.id));
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Insert new child
          await db.insert(employeeChildren).values({
            employeeId: emp.id,
            childName: emp.isDeel ? sageName : null,
            birthDate: sc.birth_date,
            notes: sageNote,
          });
          added++;
        }
      }
    } catch (err) {
      const msg = `Failed to sync children for ${emp.fullName} (sage_id=${sageId}): ${err}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  console.log(`Children sync: ${added} added, ${updated} updated, ${skipped} skipped, ${errors.length} errors`);
  return { added, updated, skipped, errors };
}

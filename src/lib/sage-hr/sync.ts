import { db } from '@/lib/db';
import { employees, vacationRecords, sageSyncLog } from '@/lib/db/schema';
import { eq, and, gte, isNull, sql } from 'drizzle-orm';
import { sageGetAll } from './client';

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

// ── 6a: Map Sage employees by email ─────────────────────────────────────────

export async function mapSageEmployees(): Promise<{ mapped: number; total: number }> {
  const sageEmployees = await sageGetAll('/employees');
  let mapped = 0;

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

  return { mapped, total: sageEmployees.length };
}

// ── 6b: Fetch all leave requests in 60-day chunks ───────────────────────────

const FROM_DATE = '2023-08-01';

export async function fetchAllLeaveRequests(): Promise<SageLeaveRequest[]> {
  const requests: SageLeaveRequest[] = [];
  let from = new Date(FROM_DATE);
  const today = new Date();

  while (from < today) {
    const to = new Date(from);
    to.setDate(to.getDate() + 60);
    if (to > today) to.setTime(today.getTime());

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    const data = await sageGetAll(
      `/leave-management/requests?from=${fromStr}&to=${toStr}`
    );
    requests.push(...data);

    from = new Date(to);
    from.setDate(from.getDate() + 1);
  }

  // Deduplicate by id
  return [...new Map(requests.map((r) => [r.id, r])).values()];
}

// ── 6e: Discrepancy report ──────────────────────────────────────────────────

export async function generateDiscrepancyReport(): Promise<Discrepancy[]> {
  const discrepancies: Discrepancy[] = [];
  const allSageRequests = await fetchAllLeaveRequests();

  const relevant = allSageRequests.filter((r) =>
    ['approved', 'pending'].includes(r.status_code?.toLowerCase())
  );

  // Get all employees with sage mapping
  const allEmployees = await db.select().from(employees);
  const empBySageId = new Map(
    allEmployees.filter((e) => e.sageEmployeeId).map((e) => [e.sageEmployeeId!, e])
  );

  // Get all vacation records
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

// ── 7: Import approved & pending records ────────────────────────────────────

export async function importSageRecords(): Promise<{
  added: number;
  updated: number;
  discrepancies: Discrepancy[];
}> {
  const allRequests = await fetchAllLeaveRequests();
  let added = 0;
  let updated = 0;

  const allEmployees = await db.select().from(employees);
  const empBySageId = new Map(
    allEmployees.filter((e) => e.sageEmployeeId).map((e) => [e.sageEmployeeId!, e])
  );

  for (const req of allRequests) {
    const status = req.status_code?.toLowerCase();
    if (!['approved', 'pending'].includes(status)) continue;

    const emp = empBySageId.get(req.employee_id);
    if (!emp) continue;

    const calDays = calendarDays(req.start_date, req.end_date);
    const year = new Date(req.start_date).getFullYear();

    // Check if already exists by sage_id
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
  }

  // Log the sync
  const discrepancies = await generateDiscrepancyReport();
  await db.insert(sageSyncLog).values({
    recordsAdded: added,
    recordsUpdated: updated,
    discrepancies: discrepancies as any,
  });

  return { added, updated, discrepancies };
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

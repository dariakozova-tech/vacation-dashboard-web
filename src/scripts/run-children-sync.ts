import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

const client = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle({ client, schema });

const { employees, employeeChildren } = schema;

const BASE_URL = `https://${process.env.SAGE_HR_SUBDOMAIN}.sage.hr/api`;
const HEADERS: Record<string, string> = {
  'X-Auth-Token': process.env.SAGE_HR_API_TOKEN!,
  'Content-Type': 'application/json',
};

async function sageGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Sage HR API error: ${res.status} ${path}`);
  return res.json();
}

async function sageGetAll(path: string): Promise<any[]> {
  const results: any[] = [];
  let page = 1;
  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const data = await sageGet(`${path}${sep}page=${page}`);
    results.push(...(data.data ?? []));
    if (!data.meta?.next_page) break;
    page++;
  }
  return results;
}

async function main() {
  // Step 1: Map employees by email
  console.log('=== Step 1: Map employees by email ===');
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

    if (result.length > 0) {
      mapped++;
      console.log(`  Mapped: ${result[0].fullName} -> Sage ID ${se.id}`);
    }
  }
  console.log(`Mapped ${mapped} employees\n`);

  // Step 2: Sync children
  console.log('=== Step 2: Sync children ===');
  let added = 0;
  let updated = 0;
  let skipped = 0;

  const allEmployees = await db
    .select()
    .from(employees)
    .where(isNotNull(employees.sageEmployeeId));

  const existingChildren = await db.select().from(employeeChildren);

  console.log(`Employees with sage_id: ${allEmployees.length}`);
  console.log(`Existing children in DB: ${existingChildren.length}`);

  for (const emp of allEmployees) {
    const sageId = emp.sageEmployeeId!;

    try {
      const response = await sageGet(`/employees/${sageId}/children`);
      const sageChildren = response.data ?? [];

      if (sageChildren.length === 0) continue;

      const empChildren = existingChildren.filter(c => c.employeeId === emp.id);

      for (const sc of sageChildren) {
        if (!sc.birth_date) { skipped++; continue; }

        const existing = empChildren.find(c => c.birthDate === sc.birth_date);
        const sageName = sc.full_name?.trim() || null;
        const sageNote = sageName ? `Sage: ${sageName}` : null;

        if (existing) {
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
            console.log(`  Updated: ${emp.fullName} -> ${sageName} (${sc.birth_date})`);
          } else {
            skipped++;
          }
        } else {
          await db.insert(employeeChildren).values({
            employeeId: emp.id,
            childName: emp.isDeel ? sageName : null,
            birthDate: sc.birth_date,
            notes: sageNote,
          });
          added++;
          console.log(`  Added: ${emp.fullName} -> ${sageName} (${sc.birth_date})`);
        }
      }
    } catch (err) {
      console.error(`Error for ${emp.fullName}: ${err}`);
    }
  }

  console.log(`\nResult: ${added} added, ${updated} updated, ${skipped} skipped`);
}

main().catch(console.error);

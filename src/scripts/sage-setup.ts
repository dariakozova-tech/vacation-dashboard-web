/**
 * One-time setup script for Sage HR integration:
 * 1. Add new employees (Сидоренко, Бровко)
 * 2. Remove Куклер
 * 3. Map sage_employee_id by email matching
 * 4. Print mapping coverage
 *
 * Run: npx tsx src/scripts/sage-setup.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, isNull, sql } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

const client = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle({ client, schema });

const { employees, vacationRecords } = schema;

async function main() {
  console.log('=== Sage HR Setup ===\n');

  // ── Step 1: Add new employees ──────────────────────────────────────────────
  const NEW_EMPLOYEES = [
    {
      fullName: 'Сидоренко Микита Юрійович',
      hireDate: '2026-03-20',
      isDeel: false,
    },
    {
      fullName: 'Бровко Анастасія Дмитрівна',
      hireDate: '2026-03-20',
      isDeel: false,
    },
  ];

  for (const emp of NEW_EMPLOYEES) {
    const existing = await db
      .select()
      .from(employees)
      .where(eq(employees.fullName, emp.fullName));

    if (existing.length > 0) {
      console.log(`✓ Already exists: ${emp.fullName}`);
    } else {
      await db.insert(employees).values(emp);
      console.log(`✅ Added: ${emp.fullName}`);
    }
  }

  // ── Step 2: Remove Куклер ──────────────────────────────────────────────────
  const kuklerName = 'Куклер Владислав Русланович';
  const kukler = await db
    .select()
    .from(employees)
    .where(eq(employees.fullName, kuklerName));

  if (kukler.length > 0) {
    // Cascade will delete vacation_records automatically
    await db.delete(employees).where(eq(employees.fullName, kuklerName));
    console.log(`🗑️  Removed: ${kuklerName}`);
  } else {
    console.log(`✓ Already removed: ${kuklerName}`);
  }

  // ── Step 3: Map sage_employee_id by email ─────────────────────────────────
  if (process.env.SAGE_HR_API_TOKEN && process.env.SAGE_HR_SUBDOMAIN) {
    const { mapSageEmployees, getMappingCoverage } = await import('../lib/sage-hr/sync');
    const result = await mapSageEmployees();
    console.log(`\n📧 Email matching: ${result.mapped} newly mapped out of ${result.total} Sage employees`);

    // ── Step 4: Coverage check ────────────────────────────────────────────────
    const coverage = await getMappingCoverage();
    console.log(`\n📊 Mapping coverage:`);
    console.log(`   Mapped: ${coverage.mapped}/${coverage.total}`);
    console.log(`   Unmapped: ${coverage.unmapped}`);
    if (coverage.unmappedEmployees.length > 0) {
      console.log(`\n   Unmapped employees:`);
      for (const e of coverage.unmappedEmployees) {
        console.log(`   - ${e.fullName} (${e.email ?? 'no email'})`);
      }
    }
  } else {
    console.log('\n⚠️  Sage HR env vars not set — skipping email mapping');
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);

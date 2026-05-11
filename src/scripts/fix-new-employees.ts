/**
 * Task 1: Fix Сидоренко and Бровко
 * - Verify/fix hire dates to 2026-03-20
 * - Remove incorrect balance_reset records
 * - Print Sage employees for manual ID mapping
 *
 * Run: npx tsx src/scripts/fix-new-employees.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

const client = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle({ client, schema });
const { employees, vacationRecords } = schema;

const TARGET_NAMES = [
  'Сидоренко Микита Юрійович',
  'Бровко Анастасія Дмитрівна',
];

async function main() {
  console.log('=== Task 1: Fix new employees ===\n');

  // 1a. Verify/fix hire dates
  for (const name of TARGET_NAMES) {
    const [emp] = await db.select().from(employees).where(eq(employees.fullName, name));
    if (!emp) {
      console.log(`⚠️  Not found: ${name}`);
      continue;
    }
    console.log(`${name}: hire_date = ${emp.hireDate}, sage_employee_id = ${emp.sageEmployeeId}`);
    if (emp.hireDate !== '2026-03-20') {
      await db.update(employees).set({ hireDate: '2026-03-20' }).where(eq(employees.id, emp.id));
      console.log(`  ✅ Fixed hire_date → 2026-03-20`);
    } else {
      console.log(`  ✓ hire_date correct`);
    }

    // 1b. Remove balance_reset records (they were hired after 2026-01-01, can't have negative balance)
    const deleted = await db
      .delete(vacationRecords)
      .where(
        and(
          eq(vacationRecords.employeeId, emp.id),
          eq(vacationRecords.recordType, 'balance_reset')
        )
      )
      .returning();
    if (deleted.length > 0) {
      console.log(`  ✅ Removed ${deleted.length} balance_reset record(s)`);
    } else {
      console.log(`  ✓ No balance_reset records`);
    }
  }

  // 1c. Print all Sage employees for manual mapping
  if (process.env.SAGE_HR_API_TOKEN && process.env.SAGE_HR_SUBDOMAIN) {
    console.log('\n=== Sage HR Employees ===\n');
    const { sageGetAll } = await import('../lib/sage-hr/client');
    const sageEmployees = await sageGetAll('/employees');
    for (const se of sageEmployees) {
      console.log(`Sage ID: ${se.id} | ${se.first_name} ${se.last_name} | ${se.email}`);
    }
    console.log(`\nTotal Sage employees: ${sageEmployees.length}`);
  } else {
    console.log('\n⚠️  SAGE_HR_API_TOKEN not set — skipping Sage employee listing');
  }

  // Final verification
  console.log('\n=== Verification ===\n');
  for (const name of TARGET_NAMES) {
    const [emp] = await db.select().from(employees).where(eq(employees.fullName, name));
    if (emp) {
      console.log(`${name}: hire_date=${emp.hireDate}, sage_employee_id=${emp.sageEmployeeId}`);
    }
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);

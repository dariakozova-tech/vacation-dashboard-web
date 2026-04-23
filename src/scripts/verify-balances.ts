import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { calculateEmployeeBalance, VacationRecordInput, EmployeeInput } from '../lib/utils/vacationLogic';

if (!process.env.DATABASE_URL_UNPOOLED) {
  console.error('ERROR: DATABASE_URL_UNPOOLED is not set in .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

const AS_OF_DATE = new Date('2026-03-23T00:00:00');

async function fetchAndPrintBalance(empId: number, empName: string, empHireDate: string): Promise<void> {
  const records = await sql`
    SELECT id, record_type, start_date, end_date, days_count, year, note
    FROM vacation_records
    WHERE employee_id = ${empId}
    ORDER BY id
  `;

  const employee: EmployeeInput = { hire_date: empHireDate };
  const vacRecords: VacationRecordInput[] = records.map(r => ({
    id: r.id as number,
    record_type: r.record_type as 'period' | 'days_sum' | 'balance_reset',
    start_date: r.start_date as string | null,
    end_date: r.end_date as string | null,
    days_count: r.days_count as number | null,
    year: r.year as number | null,
    note: r.note as string | null,
  }));

  const balance = calculateEmployeeBalance(employee, vacRecords, [], [], AS_OF_DATE);

  console.log(`\n=== ${empName} (id=${empId}) ===`);
  console.log(`  hire_date:   ${empHireDate}`);
  console.log(`  earned:      ${balance.earned} days`);
  console.log(`  used 2024:   ${balance.used2024} days`);
  console.log(`  used 2025:   ${balance.used2025} days`);
  console.log(`  used 2026:   ${balance.used2026} days`);
  console.log(`  balance:     ${balance.balance} days`);
  console.log(`  wasReset:    ${balance.wasReset}`);
  console.log(`  resetDays:   ${balance.resetDays}`);
  console.log(`  total records in Neon: ${records.length}`);
}

async function main(): Promise<void> {
  console.log(`Balance verification — as of ${AS_OF_DATE.toISOString().slice(0, 10)}`);
  console.log('Querying Neon for employees with balance_reset records...\n');

  // Find all employees who have a balance_reset record (these are the candidates for wasReset)
  const resetEmployees = await sql`
    SELECT DISTINCT e.id, e.full_name, e.hire_date::text AS hire_date
    FROM employees e
    JOIN vacation_records vr ON vr.employee_id = e.id AND vr.record_type = 'balance_reset'
    ORDER BY e.full_name
  `;

  console.log(`Found ${resetEmployees.length} employees with balance_reset records:`);
  resetEmployees.forEach(e => console.log(`  - ${e.full_name} (id=${e.id}, hire=${e.hire_date})`));

  for (const emp of resetEmployees) {
    await fetchAndPrintBalance(
      emp.id as number,
      emp.full_name as string,
      emp.hire_date as string
    );
  }

  console.log('\n--- VERIFICATION OUTPUT COMPLETE ---');
  console.log('Compare the values above against the Electron app display for these employees.');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

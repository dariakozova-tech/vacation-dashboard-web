import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // Fix 1: Update hire dates for Бровко + Сидоренко to 2026-04-20
  console.log('=== Fix 1: Hire dates ===');
  await sql`UPDATE employees SET hire_date = '2026-04-20' WHERE full_name IN ('Бровко Анастасія Дмитрівна', 'Сидоренко Микита Юрійович')`;
  const updated = await sql`SELECT full_name, hire_date FROM employees WHERE full_name IN ('Бровко Анастасія Дмитрівна', 'Сидоренко Микита Юрійович')`;
  for (const e of updated) console.log(`  ${e.full_name}: ${e.hire_date}`);

  // Fix 3: Delete Коваленко's balance_reset
  console.log('\n=== Fix 3: Remove Коваленко balance_reset ===');
  const del = await sql`
    DELETE FROM vacation_records
    WHERE employee_id = (SELECT id FROM employees WHERE full_name = 'Коваленко Кирило Сергійович')
    AND record_type = 'balance_reset'
    RETURNING id
  `;
  console.log(`  Deleted ${del.length} record(s)`);

  // Verification: remaining balance_reset records
  console.log('\n=== Remaining balance_reset records ===');
  const remaining = await sql`
    SELECT e.full_name FROM vacation_records vr
    JOIN employees e ON e.id = vr.employee_id
    WHERE vr.record_type = 'balance_reset'
    ORDER BY e.full_name
  `;
  for (const r of remaining) console.log(`  ${r.full_name}`);
  console.log(`Total: ${remaining.length}`);

  // Verify targeted employees have no reset
  console.log('\n=== Confirm no reset for targeted employees ===');
  const check = await sql`
    SELECT e.full_name, COUNT(vr.id) as reset_count
    FROM employees e
    LEFT JOIN vacation_records vr ON vr.employee_id = e.id AND vr.record_type = 'balance_reset'
    WHERE e.full_name IN (
      'Єрмохін Максим Олексійович',
      'Коваленко Кирило Сергійович',
      'Бровко Анастасія Дмитрівна',
      'Сидоренко Микита Юрійович'
    )
    GROUP BY e.full_name
  `;
  for (const r of check) console.log(`  ${r.full_name}: ${r.reset_count} reset(s)`);
}

main().catch(console.error);

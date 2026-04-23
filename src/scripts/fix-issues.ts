import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function main() {
  console.log('=== Issue 1: Єрмохін balance_reset ===\n');

  const state = await sql`
    SELECT e.full_name, e.balance_reset,
           vr.record_type, vr.note
    FROM employees e
    LEFT JOIN vacation_records vr ON vr.employee_id = e.id
      AND vr.record_type = 'balance_reset'
    WHERE e.full_name = 'Єрмохін Максим Олексійович'`;
  console.log('Current state:', JSON.stringify(state, null, 2));

  const deleted = await sql`
    DELETE FROM vacation_records
    WHERE employee_id = (SELECT id FROM employees WHERE full_name = 'Єрмохін Максим Олексійович')
      AND record_type = 'balance_reset'
    RETURNING id`;
  console.log('Deleted balance_reset records:', deleted.length);

  await sql`UPDATE employees SET balance_reset = FALSE WHERE full_name = 'Єрмохін Максим Олексійович'`;

  const confirm1 = await sql`SELECT full_name, balance_reset FROM employees WHERE full_name = 'Єрмохін Максим Олексійович'`;
  console.log('After fix:', JSON.stringify(confirm1, null, 2));

  const cats = await sql`
    SELECT category, since FROM employee_categories
    WHERE employee_id = (SELECT id FROM employees WHERE full_name = 'Єрмохін Максим Олексійович')`;
  console.log('Categories:', JSON.stringify(cats, null, 2));

  const hasD2 = cats.some((c: any) => c.category === 'disability_2');
  if (!hasD2) {
    await sql`INSERT INTO employee_categories (employee_id, category, since)
      SELECT id, 'disability_2', '2025-05-30'
      FROM employees WHERE full_name = 'Єрмохін Максим Олексійович'`;
    console.log('Inserted disability_2');
  } else {
    console.log('disability_2 already present');
  }

  console.log('\n=== Issue 2: Children data ===\n');

  const childCounts = await sql`
    SELECT e.full_name, COUNT(c.id) as child_count
    FROM employees e
    LEFT JOIN employee_children c ON c.employee_id = e.id
    GROUP BY e.full_name
    HAVING COUNT(c.id) > 0
    ORDER BY e.full_name`;
  console.log('Employees with children:');
  for (const r of childCounts) {
    console.log('  ' + r.full_name + ': ' + r.child_count);
  }

  console.log('\n=== Issue 3: Безручко earned ===\n');
  const bezr = await sql`SELECT full_name, hire_date FROM employees WHERE full_name ILIKE '%Безручко%'`;
  if (bezr.length > 0) {
    const hireDate = new Date(bezr[0].hire_date as string);
    const today = new Date('2026-04-21');
    const days = Math.floor((today.getTime() - hireDate.getTime() + 86400000) / 86400000);
    const earned = Math.round((days / 365) * 24);
    console.log('Безручко hire_date:', bezr[0].hire_date);
    console.log('Days since hire:', days);
    console.log('Earned = ROUND(' + days + '/365*24) =', earned, '✅');
  }

  console.log('\n✅ Done');
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });

import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // 1. All balance_reset records
  console.log('=== All balance_reset records ===');
  const resets = await sql`
    SELECT e.full_name, e.hire_date, vr.note, vr.days_count
    FROM vacation_records vr
    JOIN employees e ON e.id = vr.employee_id
    WHERE vr.record_type = 'balance_reset'
    ORDER BY e.full_name
  `;
  for (const r of resets) {
    console.log(`  ${r.full_name} (hired ${r.hire_date}) — note: ${r.note}, days: ${r.days_count}`);
  }
  console.log(`Total: ${resets.length}`);

  // 2. Єрмохін balance_reset check
  console.log('\n=== Єрмохін balance_reset ===');
  const yerm = await sql`
    SELECT * FROM vacation_records
    WHERE employee_id = (SELECT id FROM employees WHERE full_name = 'Єрмохін Максим Олексійович')
    AND record_type = 'balance_reset'
  `;
  console.log(yerm.length > 0 ? JSON.stringify(yerm) : 'None found');

  // 3. Коваленко balance_reset check
  console.log('\n=== Коваленко balance_reset ===');
  const kov = await sql`
    SELECT * FROM vacation_records
    WHERE employee_id = (SELECT id FROM employees WHERE full_name = 'Коваленко Кирило Сергійович')
    AND record_type = 'balance_reset'
  `;
  console.log(kov.length > 0 ? JSON.stringify(kov) : 'None found');

  // 4. 2026 records by type
  console.log('\n=== 2026 records by type ===');
  const recs2026 = await sql`
    SELECT e.full_name, vr.year, vr.record_type, COUNT(*) as cnt
    FROM vacation_records vr
    JOIN employees e ON e.id = vr.employee_id
    WHERE vr.year = 2026
    GROUP BY e.full_name, vr.year, vr.record_type
    ORDER BY e.full_name
  `;
  for (const r of recs2026) {
    console.log(`  ${r.full_name} — ${r.record_type}: ${r.cnt}`);
  }

  // 5. Hire dates for Бровко + Сидоренко
  console.log('\n=== Бровко + Сидоренко hire dates ===');
  const newEmps = await sql`
    SELECT full_name, hire_date FROM employees
    WHERE full_name IN ('Бровко Анастасія Дмитрівна', 'Сидоренко Микита Юрійович')
  `;
  for (const e of newEmps) {
    console.log(`  ${e.full_name}: ${e.hire_date}`);
  }
}

main().catch(console.error);

import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // 1. Tables
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('=== 1. Tables ===');
  console.log(tables.map((t: any) => t.table_name).join(', '));

  // 2. employee_categories
  console.log('\n=== 2. employee_categories ===');
  try {
    const cats = await sql`SELECT e.full_name, ec.category, ec.since FROM employee_categories ec JOIN employees e ON e.id = ec.employee_id ORDER BY e.full_name`;
    console.log(JSON.stringify(cats, null, 2));
  } catch (e: any) { console.log('ERROR:', e.message); }

  // 3. employee_children
  console.log('\n=== 3. employee_children ===');
  try {
    const kids = await sql`SELECT e.full_name, COUNT(c.id) as child_count FROM employee_children c JOIN employees e ON e.id = c.employee_id GROUP BY e.full_name ORDER BY e.full_name`;
    console.log(JSON.stringify(kids, null, 2));
  } catch (e: any) { console.log('ERROR:', e.message); }

  // 4. 2026 hires
  console.log('\n=== 4. 2026 hires ===');
  const hires = await sql`SELECT full_name, hire_date, sage_employee_id FROM employees WHERE hire_date >= '2026-01-01' ORDER BY full_name`;
  console.log(JSON.stringify(hires, null, 2));

  // 5. 2026 vacation records
  console.log('\n=== 5. 2026 vacation records ===');
  const recs = await sql`SELECT e.full_name, COUNT(*) as cnt, SUM(vr.days_count) as total_days FROM vacation_records vr JOIN employees e ON e.id = vr.employee_id WHERE vr.year = 2026 GROUP BY e.full_name ORDER BY e.full_name`;
  console.log(JSON.stringify(recs, null, 2));
  const total = await sql`SELECT COUNT(*) as cnt FROM vacation_records WHERE year = 2026`;
  console.log('Total 2026 records:', total[0].cnt);

  // 6. vacation_records columns
  console.log('\n=== 6. vacation_records columns ===');
  const vrCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'vacation_records' ORDER BY ordinal_position`;
  console.log(vrCols.map((c: any) => c.column_name).join(', '));

  // 7. employees columns
  console.log('\n=== 7. employees columns ===');
  const empCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'employees' ORDER BY ordinal_position`;
  console.log(empCols.map((c: any) => c.column_name).join(', '));

  // 8. employee_children columns
  console.log('\n=== 8. employee_children columns ===');
  try {
    const chCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'employee_children' ORDER BY ordinal_position`;
    console.log(chCols.map((c: any) => c.column_name).join(', '));
  } catch (e: any) { console.log('ERROR:', e.message); }

  // 9. Employee counts
  console.log('\n=== 9. Employee counts ===');
  const cnt = await sql`SELECT COUNT(*) as c FROM employees`;
  const active = await sql`SELECT COUNT(*) as c FROM employees WHERE is_active = true`;
  const deel = await sql`SELECT COUNT(*) as c FROM employees WHERE is_deel = TRUE`;
  const kukler = await sql`SELECT COUNT(*) as c FROM employees WHERE full_name ILIKE '%Куклер%'`;
  console.log(`Total: ${cnt[0].c}, Active: ${active[0].c}, Deel: ${deel[0].c}, Куклер: ${kukler[0].c}`);

  // 10. Єрмохін check
  console.log('\n=== 10. Єрмохін categories + balance_reset ===');
  const yerm = await sql`SELECT e.full_name, ec.category, ec.since FROM employee_categories ec JOIN employees e ON e.id = ec.employee_id WHERE e.full_name ILIKE '%Єрмохін%'`;
  console.log('Categories:', JSON.stringify(yerm));
  const yermResets = await sql`SELECT COUNT(*) as cnt FROM vacation_records vr JOIN employees e ON e.id = vr.employee_id WHERE e.full_name ILIKE '%Єрмохін%' AND vr.record_type = 'balance_reset'`;
  console.log('balance_reset records:', yermResets[0].cnt);

  // 11. Волошина + Савченко check
  console.log('\n=== 11. Волошина + Савченко ===');
  const vol = await sql`SELECT e.full_name, e.annual_base_days, ec.category FROM employees e LEFT JOIN employee_categories ec ON ec.employee_id = e.id WHERE e.full_name ILIKE '%Волошина%' OR e.full_name ILIKE '%Савченко%'`;
  console.log(JSON.stringify(vol, null, 2));

  // 12. balance_reset column on employees
  console.log('\n=== 12. balance_reset column on employees ===');
  try {
    const br = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'balance_reset'`;
    console.log(br.length > 0 ? `EXISTS: ${JSON.stringify(br[0])}` : 'NOT FOUND');
  } catch (e: any) { console.log('ERROR:', e.message); }
}

main().catch(console.error);

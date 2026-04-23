import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function main() {
  console.log('🔧 Batch 3 fixes\n');

  // ── Schema: add is_raised_alone column ──────────────────────────────────────
  try {
    await sql`ALTER TABLE employee_children ADD COLUMN IF NOT EXISTS is_raised_alone BOOLEAN DEFAULT FALSE`;
    console.log('✓ Added is_raised_alone column');
  } catch (e: any) {
    console.log(`○ is_raised_alone: ${e.message}`);
  }

  // ── Fix 2: Єрмохін ──────────────────────────────────────────────────────────
  const yermokhin = await sql`SELECT id, full_name, hire_date, annual_base_days FROM employees WHERE full_name = 'Єрмохін Максим Олексійович' LIMIT 1`;
  if (yermokhin.length > 0) {
    const id = yermokhin[0].id as number;
    console.log(`\nЄрмохін (id=${id}, hire=${yermokhin[0].hire_date}, days=${yermokhin[0].annual_base_days})`);

    // Set annual_base_days = 30
    await sql`UPDATE employees SET annual_base_days = 30 WHERE id = ${id}`;
    console.log('  ✓ Set annual_base_days = 30');

    // Add disability_2 if not exists
    const d2 = await sql`SELECT id FROM employee_categories WHERE employee_id = ${id} AND category = 'disability_2' LIMIT 1`;
    if (d2.length === 0) {
      await sql`INSERT INTO employee_categories (employee_id, category, since, notes) VALUES (${id}, 'disability_2', '2025-05-30', 'Інвалідність 2 групи')`;
      console.log('  ✓ Added disability_2 category');
    } else {
      console.log('  ○ disability_2 already exists');
    }

    // Remove balance_reset records
    const deleted = await sql`DELETE FROM vacation_records WHERE employee_id = ${id} AND record_type = 'balance_reset' RETURNING id`;
    console.log(`  ✓ Removed ${deleted.length} balance_reset record(s)`);
  }

  // ── Fix 3e: Seed children data ──────────────────────────────────────────────
  console.log('\n── Seeding children ──');
  const CHILDREN_DATA = [
    { full_name: 'Зенченко Сергій Борисович', count: 1 },
    { full_name: 'Оніщук Марина Володимирівна', count: 3 },
    { full_name: 'Семенюк Олександр Дмитрович', count: 3 },
    { full_name: 'Подорван Ольга Юріївна', count: 1 },
    { full_name: 'Дивнич Маргарита Юріївна', count: 2 },
    { full_name: 'Шиферсон Антон Романович', count: 1 },
    { full_name: 'Лапін Сергій Миколайович', count: 1 },
    { full_name: 'Безручко Артем Олегович', count: 3 },
    { full_name: 'Мироненко Ольга Володимирівна', count: 1 },
    { full_name: 'Породько Ярослав Володимирович', count: 3 },
    { full_name: 'Oksana Hromova', count: 2 },
    { full_name: 'Kate Sedykh', count: 1 },
  ];

  for (const { full_name, count } of CHILDREN_DATA) {
    const emp = await sql`SELECT id FROM employees WHERE full_name = ${full_name} LIMIT 1`;
    if (emp.length === 0) { console.log(`  ⚠ Not found: ${full_name}`); continue; }
    const empId = emp[0].id as number;
    const existing = await sql`SELECT COUNT(*) as c FROM employee_children WHERE employee_id = ${empId}`;
    if (Number(existing[0].c) > 0) { console.log(`  ○ ${full_name}: already has children`); continue; }
    for (let i = 0; i < count; i++) {
      await sql`INSERT INTO employee_children (employee_id, birth_date, is_raised_alone, notes) VALUES (${empId}, '2010-01-01', FALSE, 'Дата народження потребує уточнення')`;
    }
    console.log(`  ✓ Added ${count} child(ren) for ${full_name}`);
  }

  // ── Verification ──────────────────────────────────────────────────────────
  console.log('\n── Verification ──');

  // Єрмохін
  const yCheck = await sql`
    SELECT e.full_name, e.annual_base_days, ec.category, ec.since
    FROM employees e
    LEFT JOIN employee_categories ec ON ec.employee_id = e.id
    WHERE e.full_name = 'Єрмохін Максим Олексійович'
  `;
  console.log('\nЄрмохін categories:', JSON.stringify(yCheck, null, 2));

  const yResets = await sql`
    SELECT COUNT(*) as cnt FROM vacation_records
    WHERE employee_id = (SELECT id FROM employees WHERE full_name = 'Єрмохін Максим Олексійович' LIMIT 1)
    AND record_type = 'balance_reset'
  `;
  console.log('Єрмохін balance_reset count:', yResets[0].cnt);

  // Children counts
  const childCounts = await sql`
    SELECT e.full_name, COUNT(c.id) as children_count
    FROM employees e
    LEFT JOIN employee_children c ON c.employee_id = e.id
    WHERE e.full_name IN ('Оніщук Марина Володимирівна', 'Безручко Артем Олегович', 'Oksana Hromova', 'Kate Sedykh')
    GROUP BY e.full_name
  `;
  console.log('\nChildren counts:', JSON.stringify(childCounts, null, 2));

  // Oksana records
  const oksanaRecords = await sql`
    SELECT record_type, vacation_type, start_date, days_count, year
    FROM vacation_records vr
    JOIN employees e ON e.id = vr.employee_id
    WHERE e.full_name = 'Oksana Hromova'
    ORDER BY start_date NULLS LAST
  `;
  console.log('\nOksana Hromova records:', JSON.stringify(oksanaRecords, null, 2));

  console.log('\n✅ Batch 3 complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});

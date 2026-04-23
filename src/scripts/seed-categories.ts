import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function main() {
  console.log('🌱 Seeding special categories...\n');

  // ── 1. Єрмохін Максим Олексійович ──────────────────────────────────────────
  const yermokhin = await sql`SELECT id, full_name, hire_date FROM employees WHERE full_name ILIKE '%Єрмохін%' LIMIT 1`;
  if (yermokhin.length > 0) {
    const id = yermokhin[0].id as number;
    console.log(`Found Єрмохін (id=${id}, hire_date=${yermokhin[0].hire_date})`);

    // Add combat_veteran category (idempotent)
    const existing = await sql`SELECT id FROM employee_categories WHERE employee_id = ${id} AND category = 'combat_veteran' LIMIT 1`;
    if (existing.length === 0) {
      await sql`INSERT INTO employee_categories (employee_id, category, since, notes) VALUES (${id}, 'combat_veteran', '2022-01-01', 'УБД')`;
      console.log('  ✓ Added combat_veteran category');
    } else {
      console.log('  ○ combat_veteran already exists');
    }

    // Check balance_reset records
    const resets = await sql`
      SELECT id, days_count, note FROM vacation_records
      WHERE employee_id = ${id} AND record_type = 'balance_reset'
    `;
    if (resets.length > 0) {
      console.log(`  Found ${resets.length} balance_reset record(s):`);
      for (const r of resets) {
        console.log(`    id=${r.id}, days_count=${r.days_count}, note=${r.note}`);
      }

      // Show all records for context
      const records = await sql`
        SELECT record_type, vacation_type, start_date, days_count, year, note
        FROM vacation_records WHERE employee_id = ${id}
        ORDER BY start_date NULLS LAST
      `;
      console.log('  All records:');
      for (const r of records) {
        console.log(`    ${r.record_type} | ${r.vacation_type || 'main'} | ${r.start_date || r.year} | ${r.days_count} days | ${r.note || ''}`);
      }

      // Remove balance_reset — his Pool B covers the gap
      await sql`DELETE FROM vacation_records WHERE employee_id = ${id} AND record_type = 'balance_reset'`;
      console.log('  ✓ Removed balance_reset record(s)');
    } else {
      console.log('  ○ No balance_reset records');
    }
  } else {
    console.log('⚠ Єрмохін not found');
  }

  // ── 2. Волошина Олександра Євгенівна ────────────────────────────────────────
  const voloshyna = await sql`SELECT id, full_name, annual_base_days FROM employees WHERE full_name ILIKE '%Волошина%' LIMIT 1`;
  if (voloshyna.length > 0) {
    const id = voloshyna[0].id as number;
    console.log(`\nFound Волошина (id=${id}, annual_base_days=${voloshyna[0].annual_base_days})`);

    // Ensure annual_base_days = 30
    await sql`UPDATE employees SET annual_base_days = 30 WHERE id = ${id}`;
    console.log('  ✓ Set annual_base_days = 30');

    // Add disability_2 category (idempotent)
    const existing = await sql`SELECT id FROM employee_categories WHERE employee_id = ${id} AND category = 'disability_2' LIMIT 1`;
    if (existing.length === 0) {
      await sql`INSERT INTO employee_categories (employee_id, category, since, notes) VALUES (${id}, 'disability_2', '2025-07-14', 'Інвалідність 2 групи')`;
      console.log('  ✓ Added disability_2 category');
    } else {
      console.log('  ○ disability_2 already exists');
    }
  } else {
    console.log('⚠ Волошина not found');
  }

  // ── 3. Савченко Кирило Олександрович ────────────────────────────────────────
  const savchenko = await sql`SELECT id, full_name, annual_base_days FROM employees WHERE full_name ILIKE '%Савченко%' LIMIT 1`;
  if (savchenko.length > 0) {
    const id = savchenko[0].id as number;
    console.log(`\nFound Савченко (id=${id}, annual_base_days=${savchenko[0].annual_base_days})`);

    // Ensure annual_base_days = 26
    await sql`UPDATE employees SET annual_base_days = 26, is_single_parent = FALSE, single_parent_since = NULL WHERE id = ${id}`;
    console.log('  ✓ Set annual_base_days = 26, is_single_parent = false');

    // Add disability_3 category (idempotent)
    const existing = await sql`SELECT id FROM employee_categories WHERE employee_id = ${id} AND category = 'disability_3' LIMIT 1`;
    if (existing.length === 0) {
      await sql`INSERT INTO employee_categories (employee_id, category, since, notes) VALUES (${id}, 'disability_3', '2024-01-16', 'Інвалідність 3 групи')`;
      console.log('  ✓ Added disability_3 category');
    } else {
      console.log('  ○ disability_3 already exists');
    }

    // Remove any children (Савченко has no children per spec)
    await sql`DELETE FROM employee_children WHERE employee_id = ${id}`;
    console.log('  ✓ Cleaned up children');
  } else {
    console.log('⚠ Савченко not found');
  }

  // ── Verification ──────────────────────────────────────────────────────────
  console.log('\n📋 Final state:');

  const cats = await sql`
    SELECT e.full_name, ec.category, ec.since, ec.effective_to
    FROM employee_categories ec
    JOIN employees e ON e.id = ec.employee_id
    ORDER BY e.full_name
  `;
  console.log('\nCategories:');
  for (const c of cats) {
    console.log(`  ${c.full_name} → ${c.category} (since ${c.since}${c.effective_to ? `, to ${c.effective_to}` : ''})`);
  }

  const yCheck = await sql`SELECT full_name, hire_date FROM employees WHERE full_name ILIKE '%Єрмохін%' LIMIT 1`;
  if (yCheck.length > 0) {
    const yResets = await sql`SELECT COUNT(*) as cnt FROM vacation_records WHERE employee_id = (SELECT id FROM employees WHERE full_name ILIKE '%Єрмохін%' LIMIT 1) AND record_type = 'balance_reset'`;
    console.log(`\nЄрмохін: balance_reset records = ${yResets[0].cnt}`);
  }

  const vrSample = await sql`SELECT id, start_date, days_count, vacation_type FROM vacation_records LIMIT 5`;
  console.log('\nVacation records sample:');
  for (const r of vrSample) {
    console.log(`  id=${r.id} | ${r.start_date} | ${r.days_count} days | type=${r.vacation_type}`);
  }

  console.log('\n✅ Seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});

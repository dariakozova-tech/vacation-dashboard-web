import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function main() {
  console.log('🔄 Running remaining migration steps...\n');

  // ── 7. employee_categories: drop obsolete columns ─────────────────────────
  // Can't use parameterized column names — use raw SQL strings
  try {
    await sql`ALTER TABLE employee_categories DROP COLUMN IF EXISTS document_info`;
    console.log('  ✓ employee_categories: dropped document_info');
  } catch (e: any) {
    console.log(`  ○ employee_categories: document_info: ${e.message}`);
  }

  try {
    await sql`ALTER TABLE employee_categories DROP COLUMN IF EXISTS updated_at`;
    console.log('  ✓ employee_categories: dropped updated_at');
  } catch (e: any) {
    console.log(`  ○ employee_categories: updated_at: ${e.message}`);
  }

  // ── 8. employee_children: drop disability/adopted columns ─────────────────
  try {
    await sql`ALTER TABLE employee_children DROP COLUMN IF EXISTS has_disability`;
    console.log('  ✓ employee_children: dropped has_disability');
  } catch (e: any) {
    console.log(`  ○ employee_children: has_disability: ${e.message}`);
  }

  try {
    await sql`ALTER TABLE employee_children DROP COLUMN IF EXISTS disability_subgroup_a`;
    console.log('  ✓ employee_children: dropped disability_subgroup_a');
  } catch (e: any) {
    console.log(`  ○ employee_children: disability_subgroup_a: ${e.message}`);
  }

  try {
    await sql`ALTER TABLE employee_children DROP COLUMN IF EXISTS adopted`;
    console.log('  ✓ employee_children: dropped adopted');
  } catch (e: any) {
    console.log(`  ○ employee_children: adopted: ${e.message}`);
  }

  // ── 9. Fix Савченко: reset single_parent, add disability_3 ────────────────
  const savchenko = await sql`SELECT id FROM employees WHERE full_name ILIKE '%Савченко%' LIMIT 1`;
  if (savchenko.length > 0) {
    const savId = savchenko[0].id as number;
    await sql`UPDATE employees SET is_single_parent = FALSE, single_parent_since = NULL, annual_base_days = 26 WHERE id = ${savId}`;
    await sql`DELETE FROM employee_children WHERE employee_id = ${savId}`;
    await sql`DELETE FROM employee_categories WHERE employee_id = ${savId}`;
    await sql`
      INSERT INTO employee_categories (employee_id, category, since, notes)
      VALUES (${savId}, 'disability_3', '2024-01-16', 'Seed data')
    `;
    console.log('  ✓ Савченко corrected: disability_3, 26 days, no children');
  }

  // ── 10. Волошина: confirm ──────────────────────────────────────────────────
  const voloshyna = await sql`SELECT id, annual_base_days FROM employees WHERE full_name ILIKE '%Волошина%' LIMIT 1`;
  if (voloshyna.length > 0) {
    await sql`UPDATE employees SET annual_base_days = 30 WHERE id = ${voloshyna[0].id as number}`;
    console.log(`  ✓ Волошина: annual_base_days=30`);
  }

  // ── 11. Verify final state ────────────────────────────────────────────────
  console.log('\n📋 Verification:');
  const cats = await sql`SELECT id, employee_id, category, since, effective_to FROM employee_categories ORDER BY id`;
  console.log('  employee_categories:', JSON.stringify(cats, null, 2));

  const emps = await sql`SELECT id, full_name, annual_base_days, is_single_parent, single_parent_since FROM employees WHERE full_name ILIKE ANY(ARRAY['%Євр%', '%Волош%', '%Савч%']) ORDER BY id`;
  console.log('  employees (key fields):', JSON.stringify(emps, null, 2));

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

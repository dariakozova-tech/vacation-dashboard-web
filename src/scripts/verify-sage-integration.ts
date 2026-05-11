/**
 * Verification script for Sage integration tasks
 * Run: npx tsx src/scripts/verify-sage-integration.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function main() {
  console.log('=== Sage Integration Verification ===\n');

  // 1. New employees fixed
  console.log('--- Task 1: New employees ---');
  const newEmps = await sql`
    SELECT full_name, hire_date, sage_employee_id
    FROM employees
    WHERE full_name IN ('Сидоренко Микита Юрійович', 'Бровко Анастасія Дмитрівна')
  `;
  for (const e of newEmps) {
    console.log(`  ${e.full_name}: hire_date=${e.hire_date}, sage_employee_id=${e.sage_employee_id}`);
  }

  // Check no balance_reset for them
  const resets = await sql`
    SELECT e.full_name, COUNT(*) as cnt
    FROM vacation_records vr
    JOIN employees e ON e.id = vr.employee_id
    WHERE e.full_name IN ('Сидоренко Микита Юрійович', 'Бровко Анастасія Дмитрівна')
      AND vr.record_type = 'balance_reset'
    GROUP BY e.full_name
  `;
  console.log(`  balance_reset records: ${resets.length === 0 ? 'none (correct)' : JSON.stringify(resets)}`);

  // 2. Sage mapping coverage
  console.log('\n--- Task 1c/2: Sage mapping coverage ---');
  const coverage = await sql`
    SELECT
      COUNT(*) FILTER (WHERE sage_employee_id IS NOT NULL) as mapped,
      COUNT(*) FILTER (WHERE sage_employee_id IS NULL) as unmapped,
      COUNT(*) as total
    FROM employees WHERE is_active = TRUE
  `;
  console.log(`  Mapped: ${coverage[0].mapped}, Unmapped: ${coverage[0].unmapped}, Total: ${coverage[0].total}`);

  // List unmapped
  const unmapped = await sql`
    SELECT full_name, email FROM employees
    WHERE sage_employee_id IS NULL AND is_active = TRUE
    ORDER BY full_name
  `;
  if (unmapped.length > 0) {
    console.log('  Unmapped employees:');
    for (const e of unmapped) {
      console.log(`    - ${e.full_name} (${e.email ?? 'no email'})`);
    }
  }

  // 3. 2026 vacation records
  console.log('\n--- Task 2: 2026 vacation records ---');
  const records2026 = await sql`
    SELECT
      COUNT(*) as total_2026,
      COUNT(*) FILTER (WHERE source = 'sage') as from_sage,
      COUNT(*) FILTER (WHERE source = 'manual' OR source IS NULL) as manual
    FROM vacation_records WHERE year = 2026
  `;
  console.log(`  Total 2026: ${records2026[0].total_2026}, From Sage: ${records2026[0].from_sage}, Manual: ${records2026[0].manual}`);

  // 4. Cron route
  console.log('\n--- Task 4: Cron route ---');
  const fs = await import('fs');
  const cronRouteExists = fs.existsSync('src/app/api/cron/sage-sync/route.ts');
  const vercelJsonExists = fs.existsSync('vercel.json');
  console.log(`  /api/cron/sage-sync route: ${cronRouteExists ? 'EXISTS' : 'MISSING'}`);
  console.log(`  vercel.json with cron config: ${vercelJsonExists ? 'EXISTS' : 'MISSING'}`);

  // 5. Balance calc
  console.log('\n--- Task 5: Balance calculation filters ---');
  const { calculateUsedDays, getUBDUsed, getSocialUsed } = await import('../lib/utils/vacationLogic');

  // Test pending records are skipped
  const testRecords = [
    { record_type: 'period' as const, start_date: '2026-03-01', days_count: 5, status: 'approved' },
    { record_type: 'period' as const, start_date: '2026-04-01', days_count: 3, status: 'pending' },
    { record_type: 'period' as const, start_date: '2026-05-01', days_count: 2, status: 'declined' },
  ];
  const used = calculateUsedDays(testRecords, '2026-01-01', '2027-01-01');
  console.log(`  calculateUsedDays with pending+declined: ${used} (expected: 5, only approved)`);
  console.log(`  ${used === 5 ? 'PASS' : 'FAIL'}`);

  // Test UBD
  const ubdRecords = [
    { record_type: 'period' as const, vacation_type: 'ubd', start_date: '2026-06-01', days_count: 7, status: 'approved' },
    { record_type: 'period' as const, vacation_type: 'ubd', start_date: '2026-07-01', days_count: 3, status: 'pending' },
  ];
  const ubdUsed = getUBDUsed(ubdRecords, 2026);
  console.log(`  getUBDUsed with pending: ${ubdUsed} (expected: 7)`);
  console.log(`  ${ubdUsed === 7 ? 'PASS' : 'FAIL'}`);

  // Test Social
  const socialRecords = [
    { record_type: 'period' as const, vacation_type: 'social', days_count: 5, status: 'approved' },
    { record_type: 'period' as const, vacation_type: 'social', days_count: 3, status: 'declined' },
  ];
  const socialUsed = getSocialUsed(socialRecords);
  console.log(`  getSocialUsed with declined: ${socialUsed} (expected: 5)`);
  console.log(`  ${socialUsed === 5 ? 'PASS' : 'FAIL'}`);

  console.log('\n=== Verification complete ===');
}

main().catch(console.error);

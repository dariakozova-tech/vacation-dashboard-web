import { config } from 'dotenv';
config({ path: '.env.local' });

import Database from 'better-sqlite3';
import { neon } from '@neondatabase/serverless';
import * as path from 'path';
import * as os from 'os';

const DB_PATH = path.join(
  os.homedir(),
  'Library/Application Support/Techery Vacations/vacation-dashboard.db'
);

async function main() {
  // Step 1: Connect to SQLite (readonly)
  console.log(`Reading SQLite DB from: ${DB_PATH}`);
  const db = new Database(DB_PATH, { readonly: true });

  // Step 2: Read all data from SQLite
  const employees: any[] = db.prepare('SELECT * FROM employees ORDER BY id').all();
  const records: any[] = db.prepare('SELECT * FROM vacation_records ORDER BY id').all();

  console.log(`Read ${employees.length} employees, ${records.length} vacation records from SQLite`);

  db.close();
  console.log('SQLite connection closed.');

  // Step 3: Connect to Neon (unpooled for migration/DDL work)
  if (!process.env.DATABASE_URL_UNPOOLED) {
    console.error('ERROR: DATABASE_URL_UNPOOLED is not set in .env.local');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL_UNPOOLED!);
  console.log('Connected to Neon (unpooled).');

  // Step 4: TRUNCATE existing Neon data (seed.ts data has wrong IDs)
  console.log('Truncating existing data...');
  await sql`TRUNCATE vacation_records CASCADE`;
  await sql`TRUNCATE employees CASCADE`;
  console.log('Truncated vacation_records and employees.');

  // Step 5: Insert employees one at a time with OVERRIDING SYSTEM VALUE
  console.log('Inserting employees...');
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    await sql`
      INSERT INTO employees (id, full_name, hire_date, is_active, is_deel, email, created_at)
      OVERRIDING SYSTEM VALUE
      VALUES (
        ${emp.id},
        ${emp.full_name},
        ${emp.hire_date},
        ${emp.is_active === 1},
        ${emp.is_deel === 1},
        ${emp.email ?? null},
        ${emp.created_at ?? new Date().toISOString()}
      )
    `;
    if ((i + 1) % 10 === 0 || i + 1 === employees.length) {
      console.log(`  Inserted ${i + 1}/${employees.length} employees`);
    }
  }
  console.log('All employees inserted.');

  // Step 6: Insert vacation_records one at a time with OVERRIDING SYSTEM VALUE
  console.log('Inserting vacation records...');
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    await sql`
      INSERT INTO vacation_records (id, employee_id, record_type, start_date, end_date, days_count, year, note, created_at)
      OVERRIDING SYSTEM VALUE
      VALUES (
        ${rec.id},
        ${rec.employee_id},
        ${rec.record_type},
        ${rec.start_date ?? null},
        ${rec.end_date ?? null},
        ${rec.days_count ?? null},
        ${rec.year ?? null},
        ${rec.note ?? null},
        ${rec.created_at ?? new Date().toISOString()}
      )
    `;
    if ((i + 1) % 50 === 0 || i + 1 === records.length) {
      console.log(`  Inserted ${i + 1}/${records.length} vacation records`);
    }
  }
  console.log('All vacation records inserted.');

  // Step 7: Reset sequences to max_id + 1
  const maxEmpId = Math.max(...employees.map((e: any) => e.id));
  const maxVacId = Math.max(...records.map((r: any) => r.id));
  console.log(`Resetting sequences: employees_id_seq -> ${maxEmpId + 1}, vacation_records_id_seq -> ${maxVacId + 1}`);
  await sql`ALTER SEQUENCE employees_id_seq RESTART WITH ${maxEmpId + 1}`;
  await sql`ALTER SEQUENCE vacation_records_id_seq RESTART WITH ${maxVacId + 1}`;
  console.log('Sequences reset.');

  // Step 8: Verify migration
  console.log('\n--- VERIFICATION ---');
  let allPassed = true;

  // Count check: employees
  const empCount = await sql`SELECT COUNT(*)::int as count FROM employees`;
  const empCountVal = empCount[0].count;
  const empCountOk = empCountVal === employees.length;
  console.log(`Employee count: ${empCountVal} (expected ${employees.length}) — ${empCountOk ? 'PASS' : 'FAIL'}`);
  if (!empCountOk) allPassed = false;

  // Count check: vacation_records
  const recCount = await sql`SELECT COUNT(*)::int as count FROM vacation_records`;
  const recCountVal = recCount[0].count;
  const recCountOk = recCountVal === records.length;
  console.log(`Vacation record count: ${recCountVal} (expected ${records.length}) — ${recCountOk ? 'PASS' : 'FAIL'}`);
  if (!recCountOk) allPassed = false;

  // Orphan check
  const orphans = await sql`
    SELECT COUNT(*)::int as count
    FROM vacation_records vr
    LEFT JOIN employees e ON vr.employee_id = e.id
    WHERE e.id IS NULL
  `;
  const orphanCount = orphans[0].count;
  const orphanOk = orphanCount === 0;
  console.log(`Orphaned records: ${orphanCount} (expected 0) — ${orphanOk ? 'PASS' : 'FAIL'}`);
  if (!orphanOk) allPassed = false;

  // Sequence check: employees_id_seq
  const empSeq = await sql`SELECT last_value::int as val FROM employees_id_seq`;
  const empSeqVal = empSeq[0].val;
  const empSeqOk = empSeqVal >= maxEmpId + 1;
  console.log(`employees_id_seq last_value: ${empSeqVal} (expected >= ${maxEmpId + 1}) — ${empSeqOk ? 'PASS' : 'FAIL'}`);
  if (!empSeqOk) allPassed = false;

  // Sequence check: vacation_records_id_seq
  const vacSeq = await sql`SELECT last_value::int as val FROM vacation_records_id_seq`;
  const vacSeqVal = vacSeq[0].val;
  const vacSeqOk = vacSeqVal >= maxVacId + 1;
  console.log(`vacation_records_id_seq last_value: ${vacSeqVal} (expected >= ${maxVacId + 1}) — ${vacSeqOk ? 'PASS' : 'FAIL'}`);
  if (!vacSeqOk) allPassed = false;

  // Sample check: verify known employee by original ID
  const sampleEmp = employees[0];
  const sampleResult = await sql`SELECT full_name FROM employees WHERE id = ${sampleEmp.id}`;
  const sampleOk = sampleResult.length > 0 && sampleResult[0].full_name === sampleEmp.full_name;
  console.log(`Sample employee (id=${sampleEmp.id}): "${sampleResult[0]?.full_name}" (expected "${sampleEmp.full_name}") — ${sampleOk ? 'PASS' : 'FAIL'}`);
  if (!sampleOk) allPassed = false;

  console.log('\n--- VERIFICATION RESULT ---');
  if (allPassed) {
    console.log('All verification checks PASSED. Migration complete.');
  } else {
    console.error('Some verification checks FAILED. Review output above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

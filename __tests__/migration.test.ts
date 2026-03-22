import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

// Post-migration integration tests — queries real Neon database
// Requires .env.local with DATABASE_URL_UNPOOLED set

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

describe('Post-migration verification', () => {
  test('employees table has 42 rows', async () => {
    const result = await sql`SELECT COUNT(*)::int as count FROM employees`;
    expect(result[0].count).toBe(42);
  });

  test('vacation_records table has 249 rows', async () => {
    const result = await sql`SELECT COUNT(*)::int as count FROM vacation_records`;
    expect(result[0].count).toBe(249);
  });

  test('no orphaned vacation_records (FK integrity intact)', async () => {
    const result = await sql`
      SELECT COUNT(*)::int as count
      FROM vacation_records vr
      LEFT JOIN employees e ON vr.employee_id = e.id
      WHERE e.id IS NULL
    `;
    expect(result[0].count).toBe(0);
  });

  test('employee sequence is above max migrated ID (>= 49)', async () => {
    const result = await sql`SELECT last_value::int as val FROM employees_id_seq`;
    expect(result[0].val).toBeGreaterThanOrEqual(49);
  });

  test('vacation_record sequence is above max migrated ID (>= 279)', async () => {
    const result = await sql`SELECT last_value::int as val FROM vacation_records_id_seq`;
    expect(result[0].val).toBeGreaterThanOrEqual(279);
  });
});

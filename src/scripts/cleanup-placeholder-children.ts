import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

const client = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle({ client });

async function main() {
  // Delete placeholder children (birth_date = 2010-01-01) for employees who also have real Sage data
  const result = await db.execute(sql`
    DELETE FROM employee_children
    WHERE birth_date = '2010-01-01'
      AND employee_id IN (
        SELECT DISTINCT employee_id FROM employee_children
        WHERE notes LIKE 'Sage:%'
      )
  `);
  console.log('Deleted placeholder records.');

  // Verify final state
  const final = await db.execute(sql`
    SELECT e.full_name, COUNT(c.id) as child_count
    FROM employees e
    JOIN employee_children c ON c.employee_id = e.id
    GROUP BY e.full_name
    ORDER BY child_count DESC
  `);
  console.log('\n=== Final children count ===');
  for (const row of final.rows) {
    console.log(`  ${row.full_name}: ${row.child_count}`);
  }
  console.log(`Total: ${final.rows.reduce((s, r) => s + Number(r.child_count), 0)}`);
}

main().catch(console.error);

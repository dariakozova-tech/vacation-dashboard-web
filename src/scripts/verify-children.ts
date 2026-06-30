import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

const client = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle({ client });

async function main() {
  // Children count per employee
  console.log('=== Children count per employee ===');
  const counts = await db.execute(sql`
    SELECT e.full_name, COUNT(c.id) as child_count
    FROM employees e
    JOIN employee_children c ON c.employee_id = e.id
    GROUP BY e.full_name
    ORDER BY child_count DESC
  `);
  for (const row of counts.rows) {
    console.log(`  ${row.full_name}: ${row.child_count}`);
  }

  // All children with details
  console.log('\n=== All children details ===');
  const children = await db.execute(sql`
    SELECT e.full_name, e.is_deel, c.child_name, c.birth_date, c.notes
    FROM employee_children c
    JOIN employees e ON e.id = c.employee_id
    ORDER BY e.full_name, c.birth_date
  `);
  for (const row of children.rows) {
    const deel = row.is_deel ? ' [DEEL]' : '';
    console.log(`  ${row.full_name}${deel}: ${row.child_name ?? '(no UA name)'} | born: ${row.birth_date} | ${row.notes ?? ''}`);
  }

  console.log(`\nTotal children: ${children.rows.length}`);
}

main().catch(console.error);

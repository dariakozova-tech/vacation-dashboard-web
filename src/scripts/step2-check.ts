import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
async function main() {
  const emps = await sql`SELECT COUNT(*) as c FROM employees`;
  const vacs = await sql`SELECT COUNT(*) as c FROM vacation_records`;
  const cats = await sql`SELECT COUNT(*) as c FROM employee_categories`;
  const kids = await sql`SELECT COUNT(*) as c FROM employee_children`;
  const sync = await sql`SELECT COUNT(*) as c FROM sage_sync_log`;
  console.log('Employees:', emps[0].c, 'Vacations:', vacs[0].c, 'Categories:', cats[0].c, 'Children:', kids[0].c, 'SyncLog:', sync[0].c);
}
main().catch(console.error);

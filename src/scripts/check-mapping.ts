import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/db/schema';

const client = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle({ client, schema });

async function main() {
  const rows = await db.select().from(schema.employees);
  const mapped = rows.filter(r => r.sageEmployeeId != null);
  const unmapped = rows.filter(r => r.sageEmployeeId == null && r.isActive);
  console.log(`Total: ${rows.length}, Mapped: ${mapped.length}, Unmapped active: ${unmapped.length}`);
  if (unmapped.length > 0) {
    console.log('Unmapped:', unmapped.map(e => `${e.fullName} (${e.email ?? 'no email'})`).join('\n  '));
  }
}

main().catch(console.error);

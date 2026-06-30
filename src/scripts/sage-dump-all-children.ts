import { config } from 'dotenv';
config({ path: '.env.local' });

const BASE_URL = `https://${process.env.SAGE_HR_SUBDOMAIN}.sage.hr/api`;
const HEADERS: Record<string, string> = {
  'X-Auth-Token': process.env.SAGE_HR_API_TOKEN!,
  'Content-Type': 'application/json',
};

async function dumpAllChildren() {
  const res = await fetch(`${BASE_URL}/employees`, { headers: HEADERS });
  const data = await res.json();
  const employees = data.data;
  console.log(`Total employees: ${employees.length}\n`);

  let totalChildren = 0;

  for (const emp of employees) {
    const r = await fetch(`${BASE_URL}/employees/${emp.id}/children`, { headers: HEADERS });
    if (!r.ok) {
      console.log(`${emp.first_name} ${emp.last_name}: error ${r.status}`);
      continue;
    }
    const d = await r.json();
    const children = d.data || [];
    if (children.length > 0) {
      totalChildren += children.length;
      console.log(`${emp.first_name} ${emp.last_name} (ID: ${emp.id}) — ${children.length} child(ren):`);
      for (const c of children) {
        console.log(`  - ${c.full_name} (${c.relation}), born: ${c.birth_date}, needs: ${c.with_needs}`);
      }
    }
  }

  console.log(`\nTotal children found: ${totalChildren}`);
}

dumpAllChildren().catch(console.error);

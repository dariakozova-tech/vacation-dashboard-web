import { config } from 'dotenv';
config({ path: '.env.local' });

const BASE_URL = `https://${process.env.SAGE_HR_SUBDOMAIN}.sage.hr/api`;
const HEADERS: Record<string, string> = {
  'X-Auth-Token': process.env.SAGE_HR_API_TOKEN!,
  'Content-Type': 'application/json',
};

async function findChildren() {
  // 1. Get all employees
  const res = await fetch(`${BASE_URL}/employees`, { headers: HEADERS });
  const data = await res.json();
  const employees = data.data;

  // Pick first 3 employees and dump FULL response
  for (const emp of employees.slice(0, 3)) {
    console.log(`\n=== FULL employee object: ${emp.first_name} ${emp.last_name} (ID: ${emp.id}) ===`);

    const single = await fetch(`${BASE_URL}/employees/${emp.id}`, { headers: HEADERS });
    const full = await single.json();

    console.log(JSON.stringify(full.data, null, 2));
  }

  // 2. Try undocumented endpoints
  const testId = employees[0]?.id;
  const endpoints = [
    `/employees/${testId}/children`,
    `/employees/${testId}/dependents`,
    `/employees/${testId}/family`,
    `/employees/${testId}/personal`,
    `/employees/${testId}/profile`,
  ];

  for (const ep of endpoints) {
    try {
      const r = await fetch(`${BASE_URL}${ep}`, { headers: HEADERS });
      console.log(`\n${ep}: status ${r.status}`);
      if (r.ok) {
        const d = await r.json();
        console.log(JSON.stringify(d, null, 2));
      }
    } catch (e: any) {
      console.log(`${ep}: error`, e.message);
    }
  }

  // 3. Check custom-fields for ALL employees — maybe children are in custom fields for some
  for (const emp of employees.slice(0, 10)) {
    const cf = await fetch(`${BASE_URL}/employees/${emp.id}/custom-fields`, { headers: HEADERS });
    const cfData = await cf.json();
    const fields = cfData.data || [];
    const childField = fields.find((f: any) =>
      /child|дит|family|dependent|kid/i.test(f.label || '')
    );
    if (childField) {
      console.log(`\n🎯 FOUND child field for ${emp.first_name} ${emp.last_name}:`, JSON.stringify(childField));
    }
  }
}

findChildren().catch(console.error);

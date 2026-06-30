import { config } from 'dotenv';
config({ path: '.env.local' });

async function discoverChildrenFields() {
  // Dynamic import so dotenv is loaded first
  const { sageGet, sageGetAll } = await import('@/lib/sage-hr/client');

  // 1. Get all employees
  const employees = await sageGetAll('/employees');
  console.log(`Total Sage employees: ${employees.length}`);

  // 2. For the first 5 employees, fetch their custom fields
  for (const emp of employees.slice(0, 5)) {
    console.log(`\n=== ${emp.first_name} ${emp.last_name} (ID: ${emp.id}) ===`);

    // Check custom fields
    try {
      const customFields = await sageGet(`/employees/${emp.id}/custom-fields`);
      console.log('Custom fields:', JSON.stringify(customFields.data, null, 2));
    } catch (e: any) {
      console.log('Custom fields error:', e.message);
    }

    // Check if employee object itself has dependents/children
    const fullEmployee = await sageGet(`/employees/${emp.id}`);
    const data = fullEmployee.data;

    // Look for any field that might contain children/dependents
    const childRelatedKeys = Object.keys(data).filter(k =>
      /child|kid|dependent|family|offspring|son|daughter|дит/i.test(k)
    );
    if (childRelatedKeys.length > 0) {
      console.log('Child-related fields found:', childRelatedKeys);
      for (const key of childRelatedKeys) {
        console.log(`  ${key}:`, JSON.stringify(data[key]));
      }
    }

    // Also print ALL keys to find personal section fields
    console.log('All employee fields:', Object.keys(data).join(', '));
  }

  // 3. Also check for employees we KNOW have children in our DB
  const knownParents = employees.filter((e: any) =>
    /onischuk|onishchuk|bezruchko/i.test(e.email || '') ||
    /Оніщук|Безручко/i.test(`${e.first_name} ${e.last_name}`)
  );

  for (const emp of knownParents) {
    console.log(`\n=== KNOWN PARENT: ${emp.first_name} ${emp.last_name} (ID: ${emp.id}) ===`);
    try {
      const customFields = await sageGet(`/employees/${emp.id}/custom-fields`);
      console.log('Custom fields:', JSON.stringify(customFields.data, null, 2));
    } catch (e: any) {
      console.log('Custom fields error:', e.message);
    }

    // Also get full employee data
    const fullEmployee = await sageGet(`/employees/${emp.id}`);
    console.log('Full employee data keys:', Object.keys(fullEmployee.data).join(', '));
    console.log('Full employee data:', JSON.stringify(fullEmployee.data, null, 2));
  }
}

discoverChildrenFields().catch(console.error);

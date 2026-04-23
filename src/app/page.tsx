import { getEmployees } from '@/lib/services/employees';
import { getAllVacationRecords } from '@/lib/services/vacationRecords';
import { getAllEmployeeCategories } from '@/lib/services/employeeCategories';
import { getAllEmployeeChildren } from '@/lib/services/employeeChildren';
import { calculateEmployeeBalance } from '@/lib/utils/vacationLogic';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [employees, allRecords, allCategories, allChildren] = await Promise.all([
    getEmployees(),
    getAllVacationRecords(),
    getAllEmployeeCategories(),
    getAllEmployeeChildren(),
  ]);

  const allRecordsSnake = allRecords.map((r) => ({
    id: r.id,
    employee_id: r.employeeId,
    record_type: r.recordType as 'period' | 'days_sum' | 'balance_reset',
    vacation_type: r.vacationType,
    start_date: r.startDate,
    end_date: r.endDate,
    days_count: r.daysCount,
    year: r.year,
    note: r.note,
    submitted_on_time: r.submittedOnTime,
    status: r.status,
    source: r.source,
    sage_id: r.sageId,
  }));

  const allCategoriesSnake = allCategories.map((c) => ({
    id: c.id,
    employee_id: c.employeeId,
    category: c.category,
    since: c.since,
    effective_to: c.effectiveTo,
    notes: c.notes,
  }));

  const allChildrenSnake = allChildren.map((c) => ({
    id: c.id,
    employee_id: c.employeeId,
    child_name: c.childName,
    birth_date: c.birthDate,
    is_raised_alone: c.isRaisedAlone,
    notes: c.notes,
  }));

  // Compute balance for each employee
  const employeesWithBalance = employees.map((emp) => {
    const empForLogic = {
      id: emp.id,
      full_name: emp.fullName,
      hire_date: emp.hireDate,
      is_active: emp.isActive,
      is_deel: emp.isDeel,
      email: emp.email,
      annual_base_days: emp.annualBaseDays,
      is_single_parent: emp.isSingleParent,
      single_parent_since: emp.singleParentSince,
    };

    const empRecords = allRecordsSnake.filter((r) => r.employee_id === emp.id);
    const empCategories = allCategoriesSnake.filter((c) => c.employee_id === emp.id);
    const empChildren = allChildrenSnake.filter((c) => c.employee_id === emp.id);

    const balance = calculateEmployeeBalance(empForLogic, empRecords, empCategories, empChildren);

    return {
      ...empForLogic,
      ...balance,
      records: empRecords,
      categories: empCategories,
      children: empChildren,
    };
  });

  return (
    <AppShell employees={employeesWithBalance} allRecords={allRecordsSnake} />
  );
}

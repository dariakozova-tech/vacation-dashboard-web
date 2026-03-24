import { getEmployees } from '@/lib/services/employees';
import { getAllVacationRecords } from '@/lib/services/vacationRecords';
import { calculateEmployeeBalance } from '@/lib/utils/vacationLogic';
import AppShell from '@/components/AppShell';

export default async function Home() {
  const [employees, allRecords] = await Promise.all([
    getEmployees(),
    getAllVacationRecords(),
  ]);

  // Remap all records to snake_case for vacationLogic
  const allRecordsSnake = allRecords.map((r) => ({
    id: r.id,
    employee_id: r.employeeId,
    record_type: r.recordType as 'period' | 'days_sum' | 'balance_reset',
    start_date: r.startDate,
    end_date: r.endDate,
    days_count: r.daysCount,
    year: r.year,
    note: r.note,
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
    };

    const empRecords = allRecordsSnake.filter((r) => r.employee_id === emp.id);
    const balance = calculateEmployeeBalance(empForLogic, empRecords);

    return {
      ...empForLogic,
      ...balance,
      records: empRecords,
    };
  });

  return (
    <AppShell employees={employeesWithBalance} allRecords={allRecordsSnake} />
  );
}

'use server';

import { revalidatePath } from 'next/cache';
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/lib/services/employees';
import type { Employee } from '@/lib/db/schema';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getEmployeesAction(): Promise<ActionResult<Employee[]>> {
  try {
    const data = await getEmployees();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function addEmployeeAction(
  input: Parameters<typeof addEmployee>[0],
): Promise<ActionResult<Employee>> {
  try {
    const data = await addEmployee(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateEmployeeAction(
  input: Parameters<typeof updateEmployee>[0],
): Promise<ActionResult<Employee>> {
  try {
    const data = await updateEmployee(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteEmployeeAction(id: number): Promise<ActionResult<void>> {
  try {
    await deleteEmployee(id);
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

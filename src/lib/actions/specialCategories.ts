'use server';

import { revalidatePath } from 'next/cache';
import {
  addEmployeeCategory,
  updateEmployeeCategory,
  deleteEmployeeCategory,
} from '@/lib/services/employeeCategories';
import {
  addEmployeeChild,
  updateEmployeeChild,
  deleteEmployeeChild,
} from '@/lib/services/employeeChildren';
import type { EmployeeCategory, EmployeeChild } from '@/lib/db/schema';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function addEmployeeCategoryAction(
  input: Parameters<typeof addEmployeeCategory>[0],
): Promise<ActionResult<EmployeeCategory>> {
  try {
    const data = await addEmployeeCategory(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateEmployeeCategoryAction(
  input: Parameters<typeof updateEmployeeCategory>[0],
): Promise<ActionResult<EmployeeCategory>> {
  try {
    const data = await updateEmployeeCategory(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteEmployeeCategoryAction(id: number): Promise<ActionResult<void>> {
  try {
    await deleteEmployeeCategory(id);
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function addEmployeeChildAction(
  input: Parameters<typeof addEmployeeChild>[0],
): Promise<ActionResult<EmployeeChild>> {
  try {
    const data = await addEmployeeChild(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateEmployeeChildAction(
  input: Parameters<typeof updateEmployeeChild>[0],
): Promise<ActionResult<EmployeeChild>> {
  try {
    const data = await updateEmployeeChild(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteEmployeeChildAction(id: number): Promise<ActionResult<void>> {
  try {
    await deleteEmployeeChild(id);
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

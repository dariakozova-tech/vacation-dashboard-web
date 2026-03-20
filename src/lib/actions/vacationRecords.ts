'use server';

import { revalidatePath } from 'next/cache';
import {
  getVacationRecords,
  getAllVacationRecords,
  addVacationRecord,
  updateVacationRecord,
  deleteVacationRecord,
} from '@/lib/services/vacationRecords';
import type { VacationRecord } from '@/lib/db/schema';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getVacationRecordsAction(
  employeeId: number,
): Promise<ActionResult<VacationRecord[]>> {
  try {
    const data = await getVacationRecords(employeeId);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getAllVacationRecordsAction(): Promise<ActionResult<VacationRecord[]>> {
  try {
    const data = await getAllVacationRecords();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function addVacationRecordAction(
  input: Parameters<typeof addVacationRecord>[0],
): Promise<ActionResult<VacationRecord>> {
  try {
    const data = await addVacationRecord(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateVacationRecordAction(
  input: Parameters<typeof updateVacationRecord>[0],
): Promise<ActionResult<VacationRecord>> {
  try {
    const data = await updateVacationRecord(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteVacationRecordAction(id: number): Promise<ActionResult<void>> {
  try {
    await deleteVacationRecord(id);
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

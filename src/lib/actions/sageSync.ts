'use server';

import { revalidatePath } from 'next/cache';
import {
  generateDiscrepancyReport,
  importSageRecords,
  mapSageEmployees,
  getMappingCoverage,
  getLastSyncLog,
} from '@/lib/sage-hr/sync';
import type { Discrepancy } from '@/lib/sage-hr/sync';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function generateReportAction(): Promise<
  ActionResult<Discrepancy[]>
> {
  try {
    const report = await generateDiscrepancyReport();
    return { success: true, data: report };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runImportAction(): Promise<
  ActionResult<{ added: number; updated: number; discrepancies: Discrepancy[] }>
> {
  try {
    const result = await importSageRecords();
    revalidatePath('/');
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function mapEmployeesAction(): Promise<
  ActionResult<{ mapped: number; total: number }>
> {
  try {
    const result = await mapSageEmployees();
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getCoverageAction(): Promise<
  ActionResult<{
    mapped: number;
    unmapped: number;
    total: number;
    unmappedEmployees: { fullName: string; email: string | null }[];
  }>
> {
  try {
    const result = await getMappingCoverage();
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getLastSyncAction() {
  try {
    const log = await getLastSyncLog();
    return { success: true, data: log };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

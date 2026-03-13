import 'server-only';
import { db } from '@/lib/db';
import { vacationRecords } from '@/lib/db/schema';
import type { NewVacationRecord } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getVacationRecords(employeeId: number) {
  return db
    .select()
    .from(vacationRecords)
    .where(eq(vacationRecords.employeeId, employeeId))
    .orderBy(asc(vacationRecords.startDate));
}

export async function getAllVacationRecords() {
  return db
    .select()
    .from(vacationRecords)
    .orderBy(asc(vacationRecords.employeeId), asc(vacationRecords.startDate));
}

export async function addVacationRecord(
  data: Omit<NewVacationRecord, 'id' | 'createdAt'>
) {
  const [row] = await db.insert(vacationRecords).values(data).returning();
  return row;
}

export async function updateVacationRecord(
  data: { id: number } & Partial<Omit<NewVacationRecord, 'id' | 'createdAt'>>
) {
  const { id, ...rest } = data;
  const [row] = await db
    .update(vacationRecords)
    .set(rest)
    .where(eq(vacationRecords.id, id))
    .returning();
  return row;
}

export async function deleteVacationRecord(id: number) {
  await db.delete(vacationRecords).where(eq(vacationRecords.id, id));
}

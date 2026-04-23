import 'server-only';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getEmployees() {
  return db
    .select()
    .from(employees)
    .where(eq(employees.isActive, true))
    .orderBy(asc(employees.fullName));
}

export async function addEmployee(data: {
  fullName: string;
  hireDate: string;
  isDeel?: boolean;
  email?: string | null;
  annualBaseDays?: number;
  isSingleParent?: boolean;
  singleParentSince?: string | null;
}) {
  const [row] = await db.insert(employees).values(data).returning();
  return row;
}

export async function updateEmployee(data: {
  id: number;
  fullName?: string;
  hireDate?: string;
  isActive?: boolean;
  isDeel?: boolean;
  email?: string | null;
  annualBaseDays?: number;
  isSingleParent?: boolean;
  singleParentSince?: string | null;
}) {
  const { id, ...rest } = data;
  const [row] = await db
    .update(employees)
    .set(rest)
    .where(eq(employees.id, id))
    .returning();
  return row;
}

export async function deleteEmployee(id: number) {
  // PostgreSQL ON DELETE CASCADE handles vacation_records automatically
  await db.delete(employees).where(eq(employees.id, id));
}

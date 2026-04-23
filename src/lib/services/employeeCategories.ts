import { db } from '../db';
import { employeeCategories, type NewEmployeeCategory, type EmployeeCategory } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function getEmployeeCategories(employeeId: number): Promise<EmployeeCategory[]> {
  return await db
    .select()
    .from(employeeCategories)
    .where(eq(employeeCategories.employeeId, employeeId));
}

export async function getAllEmployeeCategories(): Promise<EmployeeCategory[]> {
  return await db.select().from(employeeCategories);
}

export async function addEmployeeCategory(input: NewEmployeeCategory): Promise<EmployeeCategory> {
  const [result] = await db
    .insert(employeeCategories)
    .values(input)
    .returning();
  return result;
}

export async function updateEmployeeCategory(input: { id: number } & Partial<NewEmployeeCategory>): Promise<EmployeeCategory> {
  const { id, ...data } = input;
  const [result] = await db
    .update(employeeCategories)
    .set(data)
    .where(eq(employeeCategories.id, id))
    .returning();
  return result;
}

export async function deleteEmployeeCategory(id: number): Promise<void> {
  await db.delete(employeeCategories).where(eq(employeeCategories.id, id));
}

import { db } from '../db';
import { employeeChildren, type NewEmployeeChild, type EmployeeChild } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function getEmployeeChildren(employeeId: number): Promise<EmployeeChild[]> {
  return await db
    .select()
    .from(employeeChildren)
    .where(eq(employeeChildren.employeeId, employeeId));
}

export async function getAllEmployeeChildren(): Promise<EmployeeChild[]> {
  return await db.select().from(employeeChildren);
}

export async function addEmployeeChild(input: NewEmployeeChild): Promise<EmployeeChild> {
  const [result] = await db
    .insert(employeeChildren)
    .values(input)
    .returning();
  return result;
}

export async function updateEmployeeChild(input: { id: number } & Partial<NewEmployeeChild>): Promise<EmployeeChild> {
  const { id, ...data } = input;
  const [result] = await db
    .update(employeeChildren)
    .set(data)
    .where(eq(employeeChildren.id, id))
    .returning();
  return result;
}

export async function deleteEmployeeChild(id: number): Promise<void> {
  await db.delete(employeeChildren).where(eq(employeeChildren.id, id));
}

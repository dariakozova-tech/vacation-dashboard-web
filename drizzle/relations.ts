import { relations } from "drizzle-orm/relations";
import { employees, employeeCategories, vacationRecords, employeeChildren } from "./schema";

export const employeeCategoriesRelations = relations(employeeCategories, ({one}) => ({
	employee: one(employees, {
		fields: [employeeCategories.employeeId],
		references: [employees.id]
	}),
}));

export const employeesRelations = relations(employees, ({many}) => ({
	employeeCategories: many(employeeCategories),
	vacationRecords: many(vacationRecords),
	employeeChildren: many(employeeChildren),
}));

export const vacationRecordsRelations = relations(vacationRecords, ({one}) => ({
	employee: one(employees, {
		fields: [vacationRecords.employeeId],
		references: [employees.id]
	}),
}));

export const employeeChildrenRelations = relations(employeeChildren, ({one}) => ({
	employee: one(employees, {
		fields: [employeeChildren.employeeId],
		references: [employees.id]
	}),
}));
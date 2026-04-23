import { pgTable, foreignKey, integer, varchar, date, text, timestamp, real, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const recordType = pgEnum("record_type", ['period', 'days_sum', 'balance_reset'])


export const employeeCategories = pgTable("employee_categories", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "employee_categories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	employeeId: integer("employee_id").notNull(),
	category: varchar({ length: 100 }).notNull(),
	since: date().notNull(),
	effectiveTo: date("effective_to"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "employee_categories_employee_id_employees_id_fk"
		}).onDelete("cascade"),
]);

export const vacationRecords = pgTable("vacation_records", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "vacation_records_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	employeeId: integer("employee_id").notNull(),
	recordType: recordType("record_type").notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	daysCount: real("days_count"),
	year: integer(),
	note: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	vacationType: varchar("vacation_type", { length: 50 }).default('main').notNull(),
	submittedOnTime: boolean("submitted_on_time").default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "vacation_records_employee_id_employees_id_fk"
		}).onDelete("cascade"),
]);

export const employeeChildren = pgTable("employee_children", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "employee_children_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	employeeId: integer("employee_id").notNull(),
	childName: varchar("child_name", { length: 255 }),
	birthDate: date("birth_date").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "employee_children_employee_id_employees_id_fk"
		}).onDelete("cascade"),
]);

export const employees = pgTable("employees", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "employees_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	hireDate: date("hire_date").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isDeel: boolean("is_deel").default(false).notNull(),
	email: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	annualBaseDays: integer("annual_base_days").default(24).notNull(),
	isSingleParent: boolean("is_single_parent").default(false).notNull(),
	singleParentSince: date("single_parent_since"),
});

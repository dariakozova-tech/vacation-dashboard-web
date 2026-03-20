import {
  pgTable,
  pgEnum,
  integer,
  varchar,
  boolean,
  date,
  timestamp,
  real,
  text,
} from 'drizzle-orm/pg-core';

export const recordTypeEnum = pgEnum('record_type', [
  'period',
  'days_sum',
  'balance_reset',
]);

export const employees = pgTable('employees', {
  id:        integer('id').primaryKey().generatedAlwaysAsIdentity(),
  fullName:  varchar('full_name', { length: 255 }).notNull(),
  hireDate:  date('hire_date', { mode: 'string' }).notNull(),
  isActive:  boolean('is_active').default(true).notNull(),
  isDeel:    boolean('is_deel').default(false).notNull(),
  email:     varchar('email', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vacationRecords = pgTable('vacation_records', {
  id:         integer('id').primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  recordType: recordTypeEnum('record_type').notNull(),
  startDate:  date('start_date', { mode: 'string' }),
  endDate:    date('end_date', { mode: 'string' }),
  daysCount:  real('days_count'),
  year:       integer('year'),
  note:       text('note'),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type VacationRecord = typeof vacationRecords.$inferSelect;
export type NewVacationRecord = typeof vacationRecords.$inferInsert;

import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  date,
  timestamp,
  real,
  text,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';

export const recordTypeEnum = pgEnum('record_type', [
  'period',
  'days_sum',
  'balance_reset',
]);

export const employees = pgTable('employees', {
  id:               integer('id').primaryKey().generatedAlwaysAsIdentity(),
  fullName:         varchar('full_name', { length: 255 }).notNull(),
  hireDate:         date('hire_date', { mode: 'string' }).notNull(),
  isActive:         boolean('is_active').default(true).notNull(),
  isDeel:           boolean('is_deel').default(false).notNull(),
  annualBaseDays:   integer('annual_base_days').default(24).notNull(),
  isSingleParent:   boolean('is_single_parent').default(false).notNull(),
  singleParentSince: date('single_parent_since', { mode: 'string' }),
  email:            varchar('email', { length: 255 }),
  sageEmployeeId:   integer('sage_employee_id'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vacationRecords = pgTable('vacation_records', {
  id:              integer('id').primaryKey().generatedAlwaysAsIdentity(),
  employeeId:      integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  recordType:      recordTypeEnum('record_type').notNull(),
  vacationType:    varchar('vacation_type', { length: 50 }).default('main').notNull(),
  startDate:       date('start_date', { mode: 'string' }),
  endDate:         date('end_date', { mode: 'string' }),
  daysCount:       real('days_count'),
  year:            integer('year'),
  note:            text('note'),
  submittedOnTime: boolean('submitted_on_time').default(true).notNull(),
  sageId:          integer('sage_id'),
  status:          varchar('status', { length: 50 }).default('approved'),
  source:          varchar('source', { length: 50 }).default('manual'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type VacationRecord = typeof vacationRecords.$inferSelect;
export type NewVacationRecord = typeof vacationRecords.$inferInsert;

/**
 * Special employee privilege categories.
 * category values: 'disability_1' | 'disability_2' | 'disability_3' | 'combat_veteran'
 * since: date when the status was officially granted (required)
 * effectiveTo: optional end date (e.g. if disability is temporary)
 */
export const employeeCategories = pgTable('employee_categories', {
  id:            integer('id').primaryKey().generatedAlwaysAsIdentity(),
  employeeId:    integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  category:      varchar('category', { length: 100 }).notNull(),
  since:         date('since', { mode: 'string' }).notNull(),
  effectiveTo:   date('effective_to', { mode: 'string' }),
  notes:         text('notes'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Children registry for Pool C social vacation calculation.
 * Entitlement: 10 days/year (single parent 1 child, or 2+ children under 15),
 *              17 days/year (single parent 2+ children, or multiple qualifying grounds).
 * Accumulates indefinitely — does not expire.
 */
export const employeeChildren = pgTable('employee_children', {
  id:             integer('id').primaryKey().generatedAlwaysAsIdentity(),
  employeeId:     integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  childName:      varchar('child_name', { length: 255 }),
  birthDate:      date('birth_date', { mode: 'string' }).notNull(),
  isRaisedAlone:  boolean('is_raised_alone').default(false).notNull(),
  notes:          text('notes'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type EmployeeCategory = typeof employeeCategories.$inferSelect;
export type NewEmployeeCategory = typeof employeeCategories.$inferInsert;
export type EmployeeChild = typeof employeeChildren.$inferSelect;
export type NewEmployeeChild = typeof employeeChildren.$inferInsert;

// ── Sage HR sync log ──────────────────────────────────────────────────────────

export const sageSyncLog = pgTable('sage_sync_log', {
  id:             serial('id').primaryKey(),
  syncedAt:       timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
  recordsAdded:   integer('records_added').default(0).notNull(),
  recordsUpdated: integer('records_updated').default(0).notNull(),
  discrepancies:  jsonb('discrepancies'),
  errors:         jsonb('errors'),
});

export type SageSyncLog = typeof sageSyncLog.$inferSelect;

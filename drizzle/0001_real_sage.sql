CREATE TABLE "sage_sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"records_added" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"discrepancies" jsonb,
	"errors" jsonb
);
--> statement-breakpoint
ALTER TABLE "vacation_records" ADD COLUMN "sage_id" integer;--> statement-breakpoint
ALTER TABLE "vacation_records" ADD COLUMN "status" varchar(50) DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "vacation_records" ADD COLUMN "source" varchar(50) DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "employee_children" ADD COLUMN "is_raised_alone" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "sage_employee_id" integer;
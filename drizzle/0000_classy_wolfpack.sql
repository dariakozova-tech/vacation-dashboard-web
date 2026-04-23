-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."record_type" AS ENUM('period', 'days_sum', 'balance_reset');--> statement-breakpoint
CREATE TABLE "employee_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employee_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"since" date NOT NULL,
	"effective_to" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacation_records" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vacation_records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"record_type" "record_type" NOT NULL,
	"start_date" date,
	"end_date" date,
	"days_count" real,
	"year" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"vacation_type" varchar(50) DEFAULT 'main' NOT NULL,
	"submitted_on_time" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_children" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employee_children_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"child_name" varchar(255),
	"birth_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employees_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" varchar(255) NOT NULL,
	"hire_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deel" boolean DEFAULT false NOT NULL,
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annual_base_days" integer DEFAULT 24 NOT NULL,
	"is_single_parent" boolean DEFAULT false NOT NULL,
	"single_parent_since" date
);
--> statement-breakpoint
ALTER TABLE "employee_categories" ADD CONSTRAINT "employee_categories_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_records" ADD CONSTRAINT "vacation_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_children" ADD CONSTRAINT "employee_children_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
*/
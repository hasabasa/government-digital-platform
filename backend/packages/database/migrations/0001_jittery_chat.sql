DO $$ BEGIN
 CREATE TYPE "commendation_type" AS ENUM('verbal_praise', 'written_praise', 'certificate', 'bonus', 'promotion', 'medal', 'recognition');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "disciplinary_action_type" AS ENUM('verbal_warning', 'written_warning', 'reprimand', 'severe_reprimand', 'demotion', 'salary_reduction', 'dismissal', 'suspension');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "disciplinary_status" AS ENUM('active', 'appealed', 'overturned', 'expired', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "severity_level" AS ENUM('minor', 'moderate', 'serious', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "confidentiality_level" AS ENUM('public', 'internal', 'confidential', 'secret', 'top_secret');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "task_priority" AS ENUM('low', 'normal', 'high', 'urgent', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "task_status" AS ENUM('draft', 'assigned', 'in_progress', 'on_review', 'completed', 'cancelled', 'rejected', 'overdue');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "task_type" AS ENUM('directive', 'assignment', 'request', 'project', 'meeting', 'report', 'review', 'approval', 'monitoring');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"issued_by" uuid NOT NULL,
	"organization_id" uuid,
	"commendation_type" "commendation_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"achievement" text NOT NULL,
	"performance_period" jsonb,
	"achievement_metrics" jsonb,
	"supporting_documents" jsonb DEFAULT '[]'::jsonb,
	"achievement_date" timestamp,
	"issued_date" timestamp DEFAULT now() NOT NULL,
	"effective_date" timestamp NOT NULL,
	"monetary_reward" jsonb,
	"non_monetary_benefits" jsonb,
	"reviewed_by" uuid,
	"approved_by" uuid,
	"is_public" boolean DEFAULT true,
	"published_date" timestamp,
	"is_executed" boolean DEFAULT false,
	"execution_date" timestamp,
	"execution_notes" text,
	"requires_notification" boolean DEFAULT true,
	"notification_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disciplinary_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"issued_by" uuid NOT NULL,
	"organization_id" uuid,
	"action_type" "disciplinary_action_type" NOT NULL,
	"status" "disciplinary_status" DEFAULT 'active' NOT NULL,
	"severity_level" "severity_level" DEFAULT 'moderate' NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"reason" text NOT NULL,
	"violated_regulations" jsonb DEFAULT '[]'::jsonb,
	"evidence_documents" jsonb DEFAULT '[]'::jsonb,
	"incident_date" timestamp NOT NULL,
	"issued_date" timestamp DEFAULT now() NOT NULL,
	"effective_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"conditions" text,
	"financial_impact" jsonb,
	"appeal_deadline" timestamp,
	"reviewed_by" uuid,
	"approved_by" uuid,
	"related_case_id" uuid,
	"previous_action_id" uuid,
	"is_executed" boolean DEFAULT false,
	"execution_date" timestamp,
	"execution_notes" text,
	"is_confidential" boolean DEFAULT false,
	"requires_notification" boolean DEFAULT true,
	"notification_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disciplinary_appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disciplinary_action_id" uuid NOT NULL,
	"appealed_by" uuid NOT NULL,
	"grounds" text NOT NULL,
	"supporting_evidence" jsonb DEFAULT '[]'::jsonb,
	"status" "appeal_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"review_date" timestamp,
	"review_notes" text,
	"decision" text,
	"submitted_date" timestamp DEFAULT now() NOT NULL,
	"deadline_date" timestamp NOT NULL,
	"decided_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disciplinary_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disciplinary_action_id" uuid,
	"commendation_id" uuid,
	"recipient_id" uuid NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"is_delivered" boolean DEFAULT false,
	"delivery_date" timestamp,
	"is_read" boolean DEFAULT false,
	"read_date" timestamp,
	"channels" jsonb DEFAULT '["system"]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disciplinary_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disciplinary_action_id" uuid NOT NULL,
	"from_status" "disciplinary_status",
	"to_status" "disciplinary_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"reason" text,
	"notes" text,
	"change_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"assignment_status" varchar(50) DEFAULT 'assigned' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"completed_at" timestamp,
	"assignment_note" text,
	"decline_reason" text,
	"completion_note" text,
	"work_quality_rating" integer,
	"timeliness" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"is_completed" boolean DEFAULT false,
	"order_index" integer DEFAULT 0,
	"assigned_to" uuid,
	"completed_by" uuid,
	"completed_at" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"comment_type" varchar(50) DEFAULT 'general',
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"is_internal" boolean DEFAULT false,
	"edited_at" timestamp,
	"is_edited" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"file_category" varchar(50) DEFAULT 'general',
	"description" text,
	"is_public" boolean DEFAULT false,
	"access_level" varchar(50) DEFAULT 'task_participants',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notify_on_assignment" boolean DEFAULT true,
	"notify_on_status_change" boolean DEFAULT true,
	"notify_on_due_date_approaching" boolean DEFAULT true,
	"notify_on_comments" boolean DEFAULT true,
	"notify_on_overdue" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT true,
	"sms_notifications" boolean DEFAULT false,
	"reminder_days_before" integer DEFAULT 1,
	"quiet_hours_start" varchar(5) DEFAULT '22:00',
	"quiet_hours_end" varchar(5) DEFAULT '08:00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"from_status" "task_status",
	"to_status" "task_status" NOT NULL,
	"reason" text,
	"automatic_change" boolean DEFAULT false,
	"change_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"type" "task_type" NOT NULL,
	"priority" "task_priority" DEFAULT 'normal' NOT NULL,
	"status" "task_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"assigned_to" uuid,
	"supervisor_id" uuid,
	"organization_id" uuid,
	"start_date" timestamp,
	"due_date" timestamp,
	"completed_at" timestamp,
	"estimated_hours" integer,
	"actual_hours" integer,
	"is_urgent" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"approved_by" uuid,
	"approved_at" timestamp,
	"confidentiality_level" "confidentiality_level" DEFAULT 'internal',
	"access_restrictions" text,
	"parent_task_id" uuid,
	"depends_on_task_ids" jsonb,
	"related_documents" jsonb,
	"order_number" varchar(100),
	"tags" jsonb,
	"custom_fields" jsonb,
	"result" text,
	"completion_percentage" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commendations" ADD CONSTRAINT "commendations_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commendations" ADD CONSTRAINT "commendations_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commendations" ADD CONSTRAINT "commendations_organization_id_government_structure_id_fk" FOREIGN KEY ("organization_id") REFERENCES "government_structure"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commendations" ADD CONSTRAINT "commendations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commendations" ADD CONSTRAINT "commendations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_organization_id_government_structure_id_fk" FOREIGN KEY ("organization_id") REFERENCES "government_structure"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_previous_action_id_disciplinary_actions_id_fk" FOREIGN KEY ("previous_action_id") REFERENCES "disciplinary_actions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_appeals" ADD CONSTRAINT "disciplinary_appeals_disciplinary_action_id_disciplinary_actions_id_fk" FOREIGN KEY ("disciplinary_action_id") REFERENCES "disciplinary_actions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_appeals" ADD CONSTRAINT "disciplinary_appeals_appealed_by_users_id_fk" FOREIGN KEY ("appealed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_appeals" ADD CONSTRAINT "disciplinary_appeals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_notifications" ADD CONSTRAINT "disciplinary_notifications_disciplinary_action_id_disciplinary_actions_id_fk" FOREIGN KEY ("disciplinary_action_id") REFERENCES "disciplinary_actions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_notifications" ADD CONSTRAINT "disciplinary_notifications_commendation_id_commendations_id_fk" FOREIGN KEY ("commendation_id") REFERENCES "commendations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_notifications" ADD CONSTRAINT "disciplinary_notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_status_history" ADD CONSTRAINT "disciplinary_status_history_disciplinary_action_id_disciplinary_actions_id_fk" FOREIGN KEY ("disciplinary_action_id") REFERENCES "disciplinary_actions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinary_status_history" ADD CONSTRAINT "disciplinary_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_checklist" ADD CONSTRAINT "task_checklist_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_checklist" ADD CONSTRAINT "task_checklist_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_checklist" ADD CONSTRAINT "task_checklist_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_files" ADD CONSTRAINT "task_files_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_files" ADD CONSTRAINT "task_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_notification_settings" ADD CONSTRAINT "task_notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_government_structure_id_fk" FOREIGN KEY ("organization_id") REFERENCES "government_structure"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

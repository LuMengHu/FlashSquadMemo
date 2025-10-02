CREATE TYPE "public"."progress_status" AS ENUM('unanswered', 'correct', 'incorrect');--> statement-breakpoint
CREATE TABLE "member_question_progress" (
	"member_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'unanswered' NOT NULL,
	"last_reviewed_at" timestamp,
	"next_review_at" timestamp,
	"interval" integer DEFAULT 0,
	"ease_factor" real DEFAULT 2.5,
	"correct_streak" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "member_question_progress_member_id_question_id_pk" PRIMARY KEY("member_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"team_id" uuid NOT NULL,
	"assigned_question_bank_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"mode" text DEFAULT 'standard' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_bank_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_name" varchar(256) NOT NULL,
	"password_hash" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_team_name_unique" UNIQUE("team_name")
);
--> statement-breakpoint
ALTER TABLE "member_question_progress" ADD CONSTRAINT "member_question_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_question_progress" ADD CONSTRAINT "member_question_progress_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_assigned_question_bank_id_question_banks_id_fk" FOREIGN KEY ("assigned_question_bank_id") REFERENCES "public"."question_banks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_bank_id_question_banks_id_fk" FOREIGN KEY ("question_bank_id") REFERENCES "public"."question_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_id_idx" ON "members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "question_bank_id_idx" ON "questions" USING btree ("question_bank_id");
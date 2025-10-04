ALTER TABLE "questions" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "question";
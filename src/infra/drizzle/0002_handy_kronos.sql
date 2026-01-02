CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregateType" text NOT NULL,
	"aggregateId" uuid NOT NULL,
	"aggregateVersion" integer NOT NULL,
	"eventType" text NOT NULL,
	"payload" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"processedAt" timestamp
);
--> statement-breakpoint
CREATE INDEX idx_outbox_events_unprocessed ON outbox_events("createdAt") WHERE "processedAt" IS NULL;
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;
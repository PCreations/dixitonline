-- Add version column to players table for optimistic concurrency control
ALTER TABLE "players" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;

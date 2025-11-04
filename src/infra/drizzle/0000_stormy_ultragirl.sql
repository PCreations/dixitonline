CREATE TABLE "games" (
	"id" uuid PRIMARY KEY NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"data" jsonb NOT NULL,
	"version" integer NOT NULL
);

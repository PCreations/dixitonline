import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { Schema } from 'effect';
import {
  EndedGameStatus,
  GameEntitySnapshot,
  NotStartedGameStatus,
  StartedGameStatus,
} from '../../game/game.entity.js';
import {
  EndedGameSnapshotSchema,
  NotStartedGameSnapshotSchema,
  StartedGameSnapshotSchema,
} from '../../game/game-snapshot.schema.js';

export const gamesTable = pgTable('games', {
  id: uuid().primaryKey(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull().defaultNow(),
  status: text({
    enum: [
      NotStartedGameStatus()._tag,
      StartedGameStatus()._tag,
      EndedGameStatus()._tag,
    ],
  }).notNull(),
  data: jsonb().$type<GameEntitySnapshot>().notNull(),
  version: integer().notNull(),
});

export type InsertDrizzleGameDto = typeof gamesTable.$inferInsert;

export const playersTable = pgTable('players', {
  id: uuid().primaryKey(), // = auth.users.id (Supabase UUID)
  username: text().notNull().unique(),
  email: text(), // nullable - set when user links email
  isAnonymous: boolean().notNull().default(true),
  version: integer().notNull().default(1),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export type InsertDrizzlePlayerDto = typeof playersTable.$inferInsert;
export type SelectDrizzlePlayerDto = typeof playersTable.$inferSelect;

/**
 * Outbox table for reliable event delivery.
 * Events are inserted atomically with aggregate saves,
 * then relayed to subscribers via Supabase Realtime.
 */
export const outboxEventsTable = pgTable('outbox_events', {
  id: uuid().primaryKey().defaultRandom(),
  aggregateType: text().notNull(), // 'game', 'player', etc.
  aggregateId: uuid().notNull(),
  aggregateVersion: integer().notNull(),
  eventType: text().notNull(), // 'playerJoined', 'gameStarted', etc.
  payload: jsonb().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  processedAt: timestamp(), // null until relayed, for cleanup
});

export type InsertOutboxEventDto = typeof outboxEventsTable.$inferInsert;
export type SelectOutboxEventDto = typeof outboxEventsTable.$inferSelect;

export const InsertDrizzleNotStartedGameDtoSchema = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  status: Schema.Literal('NotStartedGame'),
  data: NotStartedGameSnapshotSchema,
  version: Schema.Number,
});

export const InsertDrizzleStartedGameDtoSchema = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  status: Schema.Literal('StartedGame'),
  data: StartedGameSnapshotSchema,
  version: Schema.Number,
});

export const InsertDrizzleEndedGameDtoSchema = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  status: Schema.Literal('EndedGame'),
  data: EndedGameSnapshotSchema,
  version: Schema.Number,
});

export const InsertDrizzleGameDtoSchema = Schema.Union(
  InsertDrizzleNotStartedGameDtoSchema,
  InsertDrizzleStartedGameDtoSchema,
  InsertDrizzleEndedGameDtoSchema,
);

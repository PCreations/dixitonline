import {
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
} from 'src/game/game.entity.js';
import {
  EndedGameSnapshotSchema,
  NotStartedGameSnapshotSchema,
  StartedGameSnapshotSchema,
} from 'src/game/game-snapshot.schema.js';

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

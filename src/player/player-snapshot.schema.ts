import { Schema } from 'effect';

/**
 * Schema for PlayerEntity snapshot serialization/deserialization.
 * Used to validate data from/to the database.
 */
export const PlayerSnapshotSchema = Schema.Struct({
  id: Schema.String,
  username: Schema.String,
  email: Schema.NullOr(Schema.String),
  isAnonymous: Schema.Boolean,
  version: Schema.Number,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
});

export type PlayerSnapshot = typeof PlayerSnapshotSchema.Type;

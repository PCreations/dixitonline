import { Schema } from 'effect';
import { CardId } from './deck.entity.js';
import { PlayerId } from './player.entity.js';

const NotStartedGameStatusSchema = Schema.Struct({
  _tag: Schema.Literal('NotStartedGame'),
});

const StartedGameStatusSchema = Schema.Struct({
  _tag: Schema.Literal('StartedGame'),
});

const EndedGameStatusSchema = Schema.Struct({
  _tag: Schema.Literal('EndedGame'),
});

export const GameStatusSchema = Schema.Union(
  NotStartedGameStatusSchema,
  StartedGameStatusSchema,
  EndedGameStatusSchema,
);

const NumberOfTimesBeingStorytellerEndConditionSchema = Schema.Struct({
  type: Schema.Literal('NumberOfTimesBeingStoryteller'),
  numberOfTimes: Schema.Number,
});

const LimitOfPointsEndConditionSchema = Schema.Struct({
  type: Schema.Literal('LimitOfPoints'),
  limit: Schema.Number,
});

const EndConditionSchema = Schema.Union(
  NumberOfTimesBeingStorytellerEndConditionSchema,
  LimitOfPointsEndConditionSchema,
);

const gameSnapshotBaseSchemaStruct = {
  id: Schema.String,
  status: NotStartedGameStatusSchema,
  createdBy: Schema.String,
  deckId: Schema.String,
  endCondition: EndConditionSchema,
  players: Schema.Array(Schema.String),
  version: Schema.Number,
};

export const NotStartedGameSnapshotSchema = Schema.Struct({
  ...gameSnapshotBaseSchemaStruct,
});

export const StartedGameSnapshotSchema = Schema.Struct({
  ...gameSnapshotBaseSchemaStruct,
  status: StartedGameStatusSchema,
  scores: Schema.Array(
    Schema.Struct({
      playerId: Schema.String.pipe(Schema.fromBrand(PlayerId)),
      score: Schema.Number,
    }),
  ),
  playersReadyForNextTurn: Schema.Array(
    Schema.String.pipe(Schema.fromBrand(PlayerId)),
  ),
  playersHavingBeenStoryteller: Schema.Record({
    key: Schema.String.pipe(Schema.fromBrand(PlayerId)),
    value: Schema.Number,
  }),
  randomizeStrategy: Schema.String,
  currentTurn: Schema.Struct({
    id: Schema.String,
    gameId: Schema.String,
    currentStorytellerId: Schema.String,
    playerHands: Schema.Array(
      Schema.Struct({
        playerId: Schema.String,
        cards: Schema.Array(
          Schema.Struct({
            id: Schema.String,
            url: Schema.String,
          }),
        ),
      }),
    ),
    cardsInDrawPile: Schema.Array(
      Schema.Struct({
        id: Schema.String,
        url: Schema.String,
      }),
    ),
    phase: Schema.Union(
      Schema.Literal('storytelling'),
      Schema.Literal('selecting-cards'),
      Schema.Literal('voting'),
      Schema.Literal('scoring'),
    ),
    turnNumber: Schema.Number,
    turnClue: Schema.Option(
      Schema.Struct({
        clue: Schema.String,
        cardId: Schema.String.pipe(Schema.fromBrand(CardId)),
      }),
    ),
    startedAt: Schema.Date,
    selectedCards: Schema.Array(
      Schema.Struct({
        cardId: Schema.String.pipe(Schema.fromBrand(CardId)),
        playerId: Schema.String.pipe(Schema.fromBrand(PlayerId)),
      }),
    ),
    votedCards: Schema.Array(
      Schema.Struct({
        cardId: Schema.String.pipe(Schema.fromBrand(CardId)),
        ownedBy: Schema.String.pipe(Schema.fromBrand(PlayerId)),
        votedBy: Schema.String.pipe(Schema.fromBrand(PlayerId)),
      }),
    ),
    pointsByPlayer: Schema.Map({
      key: Schema.String.pipe(Schema.fromBrand(PlayerId)),
      value: Schema.Array(
        Schema.Struct({
          points: Schema.Number,
          reason: Schema.Union(
            Schema.TaggedStruct('EveryoneFoundTheStorytellerCard', {}),
            Schema.TaggedStruct('NoOneFoundTheStorytellerCard', {}),
            Schema.TaggedStruct('AtLeastOnePlayerFoundTheStorytellerCard', {}),
            Schema.TaggedStruct('YouFoundTheStorytellerCard', {}),
            Schema.TaggedStruct('APlayerVotedOnYourCard', {
              playerId: Schema.String.pipe(Schema.fromBrand(PlayerId)),
            }),
          ),
        }),
      ),
    }),
    playerDeadlines: Schema.Map({
      key: Schema.String.pipe(Schema.fromBrand(PlayerId)),
      value: Schema.Date,
    }),
  }),
});

export const EndedGameSnapshotSchema = Schema.Struct({
  ...gameSnapshotBaseSchemaStruct,
  status: EndedGameStatusSchema,
  scores: Schema.Array(
    Schema.Struct({
      playerId: Schema.String.pipe(Schema.fromBrand(PlayerId)),
      score: Schema.Number,
    }),
  ),
});

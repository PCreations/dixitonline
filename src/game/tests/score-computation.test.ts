import { describe, expect, test } from "vitest";
import { CardId } from "../deck.entity.js";
import {
  APlayerVotedOnYourCard,
  AtLeastOnePlayerFoundTheStorytellerCard,
  EveryoneFoundTheStorytellerCard,
  GameRulesFactory,
  NoOneFoundTheStorytellerCard,
  YouFoundTheStorytellerCard,
} from "../game-rules.js";
import { PlayerId } from "../player.entity.js";

describe.only("Score computation rules", () => {
  test("If all players have found the storyteller’s image, then the storyteller doesn’t score any points and everyone else scores 2 points", () => {
    const gameRules = GameRulesFactory.createForPlayersCount(4);

    expect(
      gameRules.computeScore({
        storytellerId: PlayerId("player-id-1"),
        votes: [
          {
            cardId: CardId("card-id-1"),
            ownedBy: PlayerId("player-id-1"),
            votes: [
              PlayerId("player-id-2"),
              PlayerId("player-id-3"),
              PlayerId("player-id-4"),
            ],
          },
          {
            cardId: CardId("card-id-2"),
            ownedBy: PlayerId("player-id-2"),
            votes: [],
          },
          {
            cardId: CardId("card-id-3"),
            ownedBy: PlayerId("player-id-3"),
            votes: [],
          },
          {
            cardId: CardId("card-id-4"),
            ownedBy: PlayerId("player-id-4"),
            votes: [],
          },
        ],
      }),
    ).toEqual([
      {
        cardId: "card-id-1",
        ownedBy: "player-id-1",
        points: [{
          value: 0,
          reason: EveryoneFoundTheStorytellerCard(),
        }],
      },
      {
        cardId: "card-id-2",
        ownedBy: "player-id-2",
        points: [{
          value: 3,
          reason: YouFoundTheStorytellerCard(),
        }, {
          value: 2,
          reason: EveryoneFoundTheStorytellerCard(),
        }],
      },
      {
        cardId: "card-id-3",
        ownedBy: "player-id-3",
        points: [{
          value: 3,
          reason: YouFoundTheStorytellerCard(),
        }, {
          value: 2,
          reason: EveryoneFoundTheStorytellerCard(),
        }],
      },
      {
        cardId: "card-id-4",
        ownedBy: "player-id-4",
        points: [{
          value: 3,
          reason: YouFoundTheStorytellerCard(),
        }, {
          value: 2,
          reason: EveryoneFoundTheStorytellerCard(),
        }],
      },
    ]);
  });

  test("If none of the players have found the storyteller’s image, then the storyteller doesn’t score any points and everyone else scores 2 points. The players who received a vote on their card earn 1 more point for each received vote", () => {
    const gameRules = GameRulesFactory.createForPlayersCount(4);

    expect(
      gameRules.computeScore({
        storytellerId: PlayerId("player-id-1"),
        votes: [
          {
            cardId: CardId("card-id-1"),
            ownedBy: PlayerId("player-id-1"),
            votes: [],
          },
          {
            cardId: CardId("card-id-2"),
            ownedBy: PlayerId("player-id-2"),
            votes: [PlayerId("player-id-3"), PlayerId("player-id-4")],
          },
          {
            cardId: CardId("card-id-3"),
            ownedBy: PlayerId("player-id-3"),
            votes: [],
          },
          {
            cardId: CardId("card-id-4"),
            ownedBy: PlayerId("player-id-4"),
            votes: [],
          },
        ],
      }),
    ).toEqual([ // TODO: refactor the result, just playerId, points. And maybe create direcrly a data tagged enum representing Value+Reason, or maybe not since it is dependent on the number of players
      {
        cardId: "card-id-1",
        ownedBy: "player-id-1",
        points: [{
          value: 0,
          reason: NoOneFoundTheStorytellerCard(),
        }],
      },
      {
        cardId: "card-id-2",
        ownedBy: "player-id-2",
        points: [{
          value: 2,
          reason: NoOneFoundTheStorytellerCard(),
        }, {
          value: 1,
          reason: APlayerVotedOnYourCard({
            playerId: PlayerId("player-id-3"),
          }),
        }, {
          value: 1,
          reason: APlayerVotedOnYourCard({
            playerId: PlayerId("player-id-4"),
          }),
        }],
      },
      {
        cardId: "card-id-3",
        ownedBy: "player-id-3",
        points: [{
          value: 2,
          reason: NoOneFoundTheStorytellerCard(),
        }],
      },
      {
        cardId: "card-id-4",
        ownedBy: "player-id-4",
        points: [{
          value: 2,
          reason: NoOneFoundTheStorytellerCard(),
        }],
      },
    ]);
  });

  test("In any other case, the storyteller scores 3 points and so do the players who found his image.", () => {
    const gameRules = GameRulesFactory.createForPlayersCount(4);

    expect(
      gameRules.computeScore({
        storytellerId: PlayerId("player-id-1"),
        votes: [
          {
            cardId: CardId("card-id-1"),
            ownedBy: PlayerId("player-id-1"),
            votes: [PlayerId("player-id-2"), PlayerId("player-id-3")],
          },
          {
            cardId: CardId("card-id-2"),
            ownedBy: PlayerId("player-id-2"),
            votes: [PlayerId("player-id-4")],
          },
          {
            cardId: CardId("card-id-3"),
            ownedBy: PlayerId("player-id-3"),
            votes: [],
          },
          {
            cardId: CardId("card-id-4"),
            ownedBy: PlayerId("player-id-3"),
            votes: [],
          },
        ],
      }),
    ).toEqual([
      {
        cardId: "card-id-1",
        ownedBy: "player-id-1",
        points: [{
          value: 3,
          reason: AtLeastOnePlayerFoundTheStorytellerCard(),
        }],
      },
      {
        cardId: "card-id-2",
        ownedBy: "player-id-2",
        points: [{
          value: 3,
          reason: YouFoundTheStorytellerCard(),
        }, {
          value: 1,
          reason: APlayerVotedOnYourCard({
            playerId: PlayerId("player-id-4"),
          }),
        }],
      },
      {
        cardId: "card-id-3",
        ownedBy: "player-id-3",
        points: [{
          value: 3,
          reason: YouFoundTheStorytellerCard(),
        }],
      },
      {
        cardId: "card-id-4",
        ownedBy: "player-id-3",
        points: [{
          value: 3,
          reason: YouFoundTheStorytellerCard(),
        }],
      },
    ]);
  });

  test("In any other case, for a 3-players game the storyteller scores 4 points and so do the players who found his image.", () => {
    const gameRules = GameRulesFactory.createForPlayersCount(3);

    expect(
      gameRules.computeScore({
        storytellerId: PlayerId("player-id-1"),
        votes: [
          {
            cardId: CardId("card-id-1"),
            ownedBy: PlayerId("player-id-1"),
            votes: [PlayerId("player-id-2")],
          },
          {
            cardId: CardId("card-id-2"),
            ownedBy: PlayerId("player-id-2"),
            votes: [PlayerId("player-id-4")],
          },
          {
            cardId: CardId("card-id-3"),
            ownedBy: PlayerId("player-id-3"),
            votes: [],
          },
        ],
      }),
    ).toEqual([
      {
        cardId: "card-id-1",
        ownedBy: "player-id-1",
        points: [{
          value: 4,
          reason: AtLeastOnePlayerFoundTheStorytellerCard(),
        }],
      },
      {
        cardId: "card-id-2",
        ownedBy: "player-id-2",
        points: [{
          value: 4,
          reason: YouFoundTheStorytellerCard(),
        }, {
          value: 1,
          reason: APlayerVotedOnYourCard({
            playerId: PlayerId("player-id-4"),
          }),
        }],
      },
      {
        cardId: "card-id-3",
        ownedBy: "player-id-3",
        points: [],
      },
    ]);
  });
});

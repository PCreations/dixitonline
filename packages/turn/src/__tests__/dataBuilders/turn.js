import faker from 'faker';
import { events } from '../../domain/events';
import { turnReducer } from '../../domain/reducer';
import { buildTestPlayer } from './player';

export const buildTestTurn = () => {
  let defaultPlayers = [
    buildTestPlayer().build(),
    buildTestPlayer().build(),
    buildTestPlayer().build(),
    buildTestPlayer().build(),
  ];
  let id = faker.random.uuid();
  let gameId = faker.random.uuid();
  let history = [];
  let storyteller;

  const getStoryteller = () => storyteller || defaultPlayers[0];

  return {
    withId(idOverride = id) {
      id = idOverride;
      return this;
    },
    withStoryteller(storytellerOverride) {
      storyteller = storytellerOverride;
      return this;
    },
    withGameId(gameIdOverride = gameId) {
      gameId = gameIdOverride;
      return this;
    },
    withPlayers(players = defaultPlayers) {
      defaultPlayers = players;
      return this;
    },
    inPlayersCardChoicePhase() {
      history.push(
        events.clueDefined({
          text: faker.lorem.sentence(),
          cardId: getStoryteller().hand[0].id,
        })
      );
      const self = this;
      return {
        ...self,
        withPlayerThatHaveChosenAcard(player = defaultPlayers[1], cardIndex = 0) {
          history.push(events.playerCardChosen({ playerId: player.id, cardId: player.hand[cardIndex].id }));
          return this;
        },
      };
    },
    inPlayersVotingPhase() {
      this.inPlayersCardChoicePhase();
      const playersCardChosenEvents = defaultPlayers
        .filter(player => player.id !== getStoryteller().id)
        .map(player => events.playerCardChosen({ playerId: player.id, cardId: player.hand[0].id }));
      history = history.concat(playersCardChosenEvents);
      const self = this;
      return {
        ...self,
        withPlayerThatHavePlayed({ playerId, voteOnCardOwnedByPlayerId }) {
          history.push(
            events.playerVoted({
              playerId,
              cardId: defaultPlayers.filter(p => p.id === voteOnCardOwnedByPlayerId)[0].hand[0].id,
            })
          );
          return this;
        },
      };
    },
    inScoringPhase() {
      return this.inPlayersVotingPhase()
        .withPlayerThatHavePlayed({
          playerId: defaultPlayers[1].id,
          voteOnCardOwnedByPlayerId: defaultPlayers[2].id,
        })
        .withPlayerThatHavePlayed({
          playerId: defaultPlayers[2].id,
          voteOnCardOwnedByPlayerId: defaultPlayers[0].id,
        })
        .withPlayerThatHavePlayed({
          playerId: defaultPlayers[3].id,
          voteOnCardOwnedByPlayerId: defaultPlayers[1].id,
        });
    },
    withHistory(historyOverrides = []) {
      history = history.concat(historyOverrides);
      return this;
    },
    build() {
      return this.getHistory().reduce(turnReducer, {});
    },
    getHistory() {
      const turnStarted = events.turnStarted({
        id,
        gameId,
        storytellerId: getStoryteller().id,
        players: defaultPlayers,
      });
      return [turnStarted, ...history];
    },
  };
};

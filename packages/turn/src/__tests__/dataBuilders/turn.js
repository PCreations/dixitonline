import faker from 'faker';
import { events } from '../../domain/events';
import { turnReducer } from '../../domain/reducers';
import { buildTestPlayer } from './player';

export const buildTestTurn = () => {
  let defaultPlayers = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
  const id = faker.random.uuid();
  const history = [];

  const getStoryteller = () => defaultPlayers[0];

  return {
    withPlayers(players = defaultPlayers) {
      defaultPlayers = players;
      return this;
    },
    inPlayersCardChoicePhase() {
      history.push(
        events.clueDefined({
          text: faker.lorem.sentence,
          cardId: getStoryteller().hand[0].id,
        })
      );
      return this;
    },
    build() {
      const turnStarted = events.turnStarted({ id, storytellerId: getStoryteller().id, players: defaultPlayers });
      return [turnStarted, ...history].reduce(turnReducer, {});
    },
  };
};

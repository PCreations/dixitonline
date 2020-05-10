import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import { defaultState, TurnPhase } from './reducer';

const getDefaultShuffle = (state = defaultState) => toShuffle => shuffleWithSeed(toShuffle, state.turn.id);

const buildPhaseView = (state = defaultState, shuffle) => {
  const properties = {};
  return {
    withTurnPhase() {
      properties.type = state.turn.phase;
      properties.id = state.turn.id;
      properties.storytellerId = state.turn.storytellerId;
      return this;
    },
    withClue() {
      properties.clue = state.turn.clue.text;
      return this;
    },
    withPlayerHand(playerId) {
      properties.hand = state.turn.handByPlayerId[playerId];
      return this;
    },
    withBoardForVoting(viewedByPlayerId) {
      const boardWithoutVotes = shuffle(
        state.turn.board
          .filter(({ playerId }) => {
            if (viewedByPlayerId === state.turn.storytellerId) return true;
            return playerId !== viewedByPlayerId;
          })
          .map(({ id, url }) => ({ id, url }))
      );
      properties.board = boardWithoutVotes;
      return this;
    },
    withBoardAndVotes() {
      properties.board = state.turn.board.map(({ votes, ...boardRest }) => ({
        ...boardRest,
        votes: votes.map(playerId => {
          if (!state.playerById[playerId]) {
            console.log(`player ${playerId} not found`, state.playerById);
            return {};
          }
          return {
            id: playerId,
            name: state.playerById[playerId].name,
          };
        }),
      }));
      return this;
    },
    withPlayersAsEveryoneReadyExceptStoryteller() {
      properties.players = Object.values(state.playerById).map(player => ({
        ...player,
        readyForNextPhase: player.id !== state.turn.storytellerId,
      }));
      return this;
    },
    withPlayersAsReadyIfTheyHaveChosenACard() {
      properties.players = Object.values(state.playerById).map(player => ({
        ...player,
        readyForNextPhase:
          player.id === state.turn.storytellerId || state.turn.board.some(card => card.playerId === player.id),
      }));
      return this;
    },
    withPlayersAsReadyIfTheyHaveChosenTwoCards() {
      properties.players = Object.values(state.playerById).map(player => ({
        ...player,
        readyForNextPhase:
          player.id === state.turn.storytellerId ||
          state.turn.board.filter(card => card.playerId === player.id).length === 2,
      }));
      console.log(state.turn.board);
      return this;
    },
    withPlayersAsReadyIfTheyHaveVoted() {
      properties.players = Object.values(state.playerById).map(player => {
        return {
          ...player,
          readyForNextPhase:
            player.id === state.turn.storytellerId || state.turn.board.some(card => card.votes.includes(player.id)),
        };
      });
      return this;
    },
    withPlayersAndScore() {
      properties.players = Object.values(state.playerById).map(player => {
        return {
          ...player,
          readyForNextPhase: true,
          score: state.turn.score[player.id],
        };
      });
      return this;
    },
    build() {
      return properties;
    },
  };
};

export const viewPhaseAs = (state = defaultState, playerId, shuffle) => {
  const shuffleFunction = shuffle || getDefaultShuffle(state);
  switch (state.turn.phase) {
    case TurnPhase.STORYTELLER:
      return buildPhaseView(state)
        .withTurnPhase()
        .withPlayerHand(playerId)
        .withPlayersAsEveryoneReadyExceptStoryteller()
        .build();
    case TurnPhase.PLAYERS_CARD_CHOICE: {
      const phase = buildPhaseView(state)
        .withTurnPhase()
        .withClue()
        .withPlayerHand(playerId);
      return Object.keys(state.playerById).length === 3
        ? phase.withPlayersAsReadyIfTheyHaveChosenTwoCards().build()
        : phase.withPlayersAsReadyIfTheyHaveChosenACard().build();
    }
    case TurnPhase.PLAYERS_VOTING:
      return buildPhaseView(state, shuffleFunction)
        .withTurnPhase()
        .withClue()
        .withBoardForVoting(playerId)
        .withPlayerHand(playerId)
        .withPlayersAsReadyIfTheyHaveVoted()
        .build();
    case TurnPhase.SCORING:
      return buildPhaseView(state)
        .withTurnPhase()
        .withClue()
        .withBoardAndVotes()
        .withPlayerHand(playerId)
        .withPlayersAndScore()
        .build();
    default:
      return {};
  }
};

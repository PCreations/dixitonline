import { defaultState, TurnPhase } from './reducers';

const buildPhaseView = (state = defaultState) => {
  const properties = {};
  return {
    withTurnPhase() {
      properties.type = state.turn.phase;
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
    withBoardForVoting() {
      const boardWithoutVotes = state.turn.board.map(({ id, url }) => ({ id, url }));
      properties.board = boardWithoutVotes;
      return this;
    },
    withBoardAndVotes() {
      properties.board = state.turn.board;
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

export const viewPhaseAs = (state = defaultState, playerId) => {
  switch (state.turn.phase) {
    case TurnPhase.STORYTELLER:
      return buildPhaseView(state)
        .withTurnPhase()
        .withPlayerHand(playerId)
        .withPlayersAsEveryoneReadyExceptStoryteller()
        .build();
    case TurnPhase.PLAYERS_CARD_CHOICE:
      return buildPhaseView(state)
        .withTurnPhase()
        .withClue()
        .withPlayerHand(playerId)
        .withPlayersAsReadyIfTheyHaveChosenACard()
        .build();
    case TurnPhase.PLAYERS_VOTING:
      return buildPhaseView(state)
        .withTurnPhase()
        .withClue()
        .withBoardForVoting()
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

/* eslint-disable no-param-reassign */
import { produce } from 'immer';
import { combineReducers } from 'redux';
import { events } from './events';
import { computeScore } from './compute-score';

export const TurnPhase = {
  STORYTELLER: 'STORYTELLER',
  PLAYERS_CARD_CHOICE: 'PLAYERS_CARD_CHOICE',
  PLAYERS_VOTING: 'PLAYERS_VOTING',
  SCORING: 'SCORING',
};
const defaultHandByPlayerId = {};
const defaultTurnState = {
  id: null,
  gameId: null,
  storytellerId: null,
  phase: TurnPhase.STORYTELLER,
  score: {},
  clue: {
    text: '',
    cardId: null,
  },
  board: [],
  handByPlayerId: defaultHandByPlayerId,
};
const defaultPlayerByIdState = {};
export const defaultState = {
  turn: defaultTurnState,
  playerById: defaultPlayerByIdState,
};

const handByPlayerId = (state = defaultHandByPlayerId, event) =>
  produce(state, draft => {
    if (!event) return draft;
    switch (event.type) {
      case events.types.TURN_STARTED:
        event.payload.players.forEach(player => {
          draft[player.id] = player.hand;
        });
        return draft;
      default:
        return draft;
    }
  });

const turnStorytellerPhaseReducer = (state = defaultTurnState, event) =>
  produce(state, draft => {
    if (!event) return draft;
    switch (event.type) {
      case events.types.TURN_STARTED:
        draft.id = event.payload.id;
        draft.gameId = event.payload.gameId;
        draft.storytellerId = event.payload.storytellerId;
        draft.handByPlayerId = handByPlayerId(draft.handByPlayerId, event);
        return draft;
      case events.types.CLUE_DEFINED: {
        const { text, cardId } = event.payload;

        const storytellerHand = draft.handByPlayerId[draft.storytellerId];
        if (storytellerHand.some(card => card.id === cardId)) {
          draft.phase = TurnPhase.PLAYERS_CARD_CHOICE;
          draft.clue.text = text;
          draft.clue.cardId = cardId;
        }
        return draft;
      }
      default:
        return draft;
    }
  });

const turnPlayersCardChoicePhaseReducer = (state = defaultTurnState, event) =>
  produce(state, draft => {
    if (!event) return draft;
    switch (event.type) {
      case events.types.PLAYER_CARD_CHOSEN: {
        const { playerId, cardId } = event.payload;
        if (playerId === state.storytellerId) {
          return draft;
        }
        const chosenCardIndex = draft.handByPlayerId[playerId].findIndex(card => card.id === cardId);
        if (chosenCardIndex !== -1) {
          const [chosenCard] = draft.handByPlayerId[playerId].splice(chosenCardIndex, 1);
          draft.board.push({
            ...chosenCard,
            playerId,
            votes: [],
          });
        }
        if (draft.board.length === Object.values(draft.handByPlayerId).length - 1) {
          const storytellerCardIndex = draft.handByPlayerId[draft.storytellerId].findIndex(
            card => card.id === draft.clue.cardId
          );
          const [storytellerCard] = draft.handByPlayerId[draft.storytellerId].splice(storytellerCardIndex, 1);
          draft.phase = TurnPhase.PLAYERS_VOTING;
          draft.board.push({
            ...storytellerCard,
            playerId: draft.storytellerId,
            votes: [],
          });
        }
        return draft;
      }
      default:
        return draft;
    }
  });

const turnPlayersVotingPhaseReducer = (state = defaultTurnState, event) => {
  if (!event) return state;
  const newState = produce(state, draft => {
    if (!event) return draft;
    switch (event.type) {
      case events.types.PLAYER_VOTED: {
        const { cardId, playerId } = event.payload;
        if (playerId !== draft.storytellerId) {
          draft.board.forEach(card => {
            if (card.id === cardId && playerId !== card.playerId) {
              card.votes.push(playerId);
            }
          });
        }
        return draft;
      }
      default:
        return draft;
    }
  });
  if (event.type === events.types.PLAYER_VOTED) {
    const votesNumber = newState.board.reduce((total, card) => total + card.votes.length, 0);
    if (votesNumber === Object.values(newState.handByPlayerId).length - 1) {
      const score = computeScore({
        storytellerId: newState.storytellerId,
        board: newState.board,
      });
      return {
        ...newState,
        phase: TurnPhase.SCORING,
        score,
      };
    }
  }
  return newState;
};

const turn = (state = defaultTurnState, event) => {
  switch (state.phase) {
    case TurnPhase.STORYTELLER:
      return turnStorytellerPhaseReducer(state, event);
    case TurnPhase.PLAYERS_CARD_CHOICE:
      return turnPlayersCardChoicePhaseReducer(state, event);
    case TurnPhase.PLAYERS_VOTING:
      return turnPlayersVotingPhaseReducer(state, event);
    default:
      return state;
  }
};

const playerById = (state = defaultPlayerByIdState, event) =>
  produce(state, draft => {
    if (!event) return draft;
    switch (event.type) {
      case events.types.TURN_STARTED:
        event.payload.players.forEach(player => {
          draft[player.id] = {
            id: player.id,
            name: player.name,
          };
        });
        return draft;
      default:
        return draft;
    }
  });

export const turnReducer = combineReducers({
  turn,
  playerById,
});

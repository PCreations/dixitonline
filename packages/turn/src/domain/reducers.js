/* eslint-disable no-param-reassign */
import { produce } from 'immer';
import { combineReducers } from 'redux';
import { events } from './events';

export const TurnPhase = {
  STORYTELLER: 'STORYTELLER',
  PLAYERS_CARD_CHOICE: 'PLAYERS_CARD_CHOICE',
};
const defaultHandByPlayerId = {};
const defaultTurnState = {
  id: null,
  storytellerId: null,
  phase: TurnPhase.STORYTELLER,
  clue: {
    text: '',
    cardId: null,
  },
  board: [],
  handByPlayerId: defaultHandByPlayerId,
};
const defaultPlayerByIdState = {};

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
          });
        }
        return draft;
      }
      default:
        return draft;
    }
  });

const turn = (state = defaultTurnState, event) => {
  switch (state.phase) {
    case TurnPhase.STORYTELLER:
      return turnStorytellerPhaseReducer(state, event);
    case TurnPhase.PLAYERS_CARD_CHOICE:
      return turnPlayersCardChoicePhaseReducer(state, event);
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

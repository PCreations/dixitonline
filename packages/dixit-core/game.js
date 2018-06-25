const createStore = require('@pcreations/tamia');
const { Record, Map } = require('immutable');
const { pipe } = require('ramda');

const selectCard = selectedCardId => state => state.set('selectedCardId', selectedCardId);
const updateCardDescription = cardDescription => state => state.set('cardDescription', cardDescription);
const playerDidChoose = playerId => state => state.updateIn(
  ['otherPlayers', String(playerId)],
  () => true
);
const playerDidVote = playerId => playerDidChoose(playerId);

const TellerPhaseState = Record({
  tellerId: undefined,
  cards: [],
  selectedCardId: undefined,
  cardDescription: undefined,
});

const createTellerPhase = initialState => {
  const state = createStore(new TellerPhaseState(state));
  return {
    state: state.value,
    selectCard: selectedCardId => state.update(selectCard(selectedCardId)),
    updateCardDescription: description => state.update(updateCardDescription(description)),
  };
};

pipe(
  createStore(state => new TellerPhaseState(state)),
  withAction(updateCardDescription),
  withAction(selectCard)
);


const PlayerChoicePhaseState = Record({
  playerId: undefined,
  cards: [],
  selectedCardId: undefined,
  cardDescription: undefined,
});

const createPlayerChoicePhase = pipe(
  createStore(state => new PlayerChoicePhaseState(state)),
  withAction(selectCard),
);


const WaitingForOtherPlayerChoicePhaseState = Record({
  playerId: undefined,
  cards: [],
  cardDescription: undefined,
  otherPlayers: Map({}),
});

const createWaitingForOtherPlayerChoicePhase = pipe(
  createStore((state = {}) => new WaitingForOtherPlayerChoicePhaseState({
    ...state,
    otherPlayers: Map(state.otherPlayers || {}),
  })),
  withAction(playerDidChoose),
);


const PlayerVotePhaseState = Record({
  playerId: undefined,
  cards: [],
  selectedCardId: undefined,
  cardDescription: undefined,
});

const createPlayerVotePhase = pipe(
  createStore(state => new PlayerVotePhaseState(state)),
  withAction(selectCard),
);


const WaitingForOtherPlayersVotePhaseState = Record({
  playerId: undefined,
  cards: [],
  cardDescription: undefined,
  otherPlayers: Map({}),
});

const createWaitingForOtherPlayersVotePhase = pipe(
  createStore((state = {}) => new WaitingForOtherPlayersVotePhaseState({
    ...state,
    otherPlayers: Map(state.otherPlayers || {})
  })),
  withAction(playerDidVote),
);

module.exports = {
  createTellerPhase,
  createPlayerChoicePhase,
  createWaitingForOtherPlayerChoicePhase,
  createPlayerVotePhase,
  createWaitingForOtherPlayersVotePhase,
};

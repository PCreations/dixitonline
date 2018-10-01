[
  {
    type: 'GAME_CREATED',
    playerId: 'Julien',
    deck: [
      {
        cardId: 0,
        img: '',
      },
      {
        cardId: 1,
        img: '',
      },
      ...otherCards,
    ],
  },
  {
    type: 'PLAYER_JOINED',
    playerId: 'Mathilde',
  },
  {
    type: 'PLAYER_JOINED',
    playerId: 'Lea',
  },
  {
    type: 'PLAYER_JOINED',
    playerId: 'Tom',
  },
  {
    type: 'GAME_STARTED',
    playersOrder: ['Julien', 'Mathilde', 'Lea', 'Tom'],
  },
  {
    type: 'CARDS_DEALT',
    hands: {
      Julien: [c1, c2, c3, ...],
      Mathilde: [c4, c5...],
      ...
    }
  },
  
];

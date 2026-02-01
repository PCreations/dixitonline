import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import type {
  CardView,
  EndedView,
  GamePlayerView,
  PlayerInfo,
  ScoringView,
  SelectingCardsAsGuesserView,
  SelectingCardsAsStorytellerView,
  StorytellingAsGuesserView,
  StorytellingPhaseAsStorytellerView,
  VotingAsGuesserView,
  VotingAsStorytellerView,
} from '../../game/game.query-service.js';
import { Game } from '../../view/components/Game.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:44321';

const buildCardUrl = (cardNumber: number) =>
  `${SUPABASE_URL}/storage/v1/object/public/decks/default/card_${cardNumber}.jpg`;

// Mock data
const mockCurrentPlayer: PlayerInfo = {
  id: 'player-1',
  name: 'Toi',
  isCurrentPlayer: true,
};

const mockStoryteller: PlayerInfo = {
  id: 'player-2',
  name: 'Alice',
  isCurrentPlayer: false,
};

const mockHand: ReadonlyArray<CardView> = [100, 101, 102, 103, 104, 105].map(
  (n) => ({
    id: `card_${n}`,
    url: buildCardUrl(n),
  }),
);

const mockBoardCards: ReadonlyArray<CardView> = [
  200, 201, 202, 203, 204, 205,
].map((n) => ({
  id: `card_${n}`,
  url: buildCardUrl(n),
}));

const mockPlayer3: PlayerInfo = {
  id: 'player-3',
  name: 'Bob',
  isCurrentPlayer: false,
};

const mockPlayer4: PlayerInfo = {
  id: 'player-4',
  name: 'Charlie',
  isCurrentPlayer: false,
};

const mockPlayer5: PlayerInfo = {
  id: 'player-5',
  name: 'Diana',
  isCurrentPlayer: false,
};

const mockPlayer6: PlayerInfo = {
  id: 'player-6',
  name: 'Eve',
  isCurrentPlayer: false,
};

const mockPlayersStatus = [
  { player: mockCurrentPlayer, status: 'ready' as const, score: 12 },
  { player: mockStoryteller, status: 'not-ready' as const, score: 8 },
  { player: mockPlayer3, status: 'ready' as const, score: 5 },
  { player: mockPlayer4, status: 'ready' as const, score: 10 },
  { player: mockPlayer5, status: 'not-ready' as const, score: 7 },
  { player: mockPlayer6, status: 'ready' as const, score: 3 },
];

const devPreviewRoutes: FastifyPluginAsync = async (fastify) => {
  const { renderHtmlPage, renderToString } = fastify;

  // Helper function to render game preview
  function renderGamePreview(
    reply: import('fastify').FastifyReply,
    title: string,
    view: GamePlayerView,
  ) {
    const component = h(Game, { view });
    const body = renderToString(component);
    const html = renderHtmlPage(`Preview: ${title} - Tixid Online`, body, {
      isAuthenticated: true,
    });
    return reply.type('text/html').send(html);
  }

  // Index page listing all preview routes
  fastify.get('/dev/preview', async (_request, reply) => {
    const html = renderHtmlPage(
      'Dev Preview - Game Views',
      `
      <div style="max-width: 600px; margin: 0 auto; padding: 32px; color: white;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Game View Previews</h1>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <h2 style="font-size: 18px; font-weight: 600; margin-top: 16px;">Storytelling Phase</h2>
          <ul style="list-style: disc; padding-left: 24px;">
            <li><a href="/dev/preview/storytelling-storyteller" style="color: #93c5fd;">Storytelling as Storyteller</a></li>
            <li><a href="/dev/preview/storytelling-guesser" style="color: #93c5fd;">Storytelling as Guesser</a></li>
          </ul>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 16px;">Selecting Cards Phase</h2>
          <ul style="list-style: disc; padding-left: 24px;">
            <li><a href="/dev/preview/selecting-storyteller" style="color: #93c5fd;">Selecting Cards as Storyteller</a></li>
            <li><a href="/dev/preview/selecting-guesser" style="color: #93c5fd;">Selecting Cards as Guesser</a></li>
          </ul>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 16px;">Voting Phase</h2>
          <ul style="list-style: disc; padding-left: 24px;">
            <li><a href="/dev/preview/voting-storyteller" style="color: #93c5fd;">Voting as Storyteller</a></li>
            <li><a href="/dev/preview/voting-guesser" style="color: #93c5fd;">Voting as Guesser</a></li>
          </ul>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 16px;">Scoring & End</h2>
          <ul style="list-style: disc; padding-left: 24px;">
            <li><a href="/dev/preview/scoring" style="color: #93c5fd;">Scoring</a></li>
            <li><a href="/dev/preview/ended" style="color: #93c5fd;">Game Ended</a></li>
          </ul>
        </div>
      </div>
    `,
      { isAuthenticated: true },
    );
    return reply.type('text/html').send(html);
  });

  // Storytelling as Storyteller
  fastify.get(
    '/dev/preview/storytelling-storyteller',
    async (_request, reply) => {
      const view: StorytellingPhaseAsStorytellerView = {
        _tag: 'StorytellingPhaseAsStoryteller',
        gameId: 'dev-game',
        currentPlayer: mockCurrentPlayer,
        score: 0,
        turnNumber: 1,
        storyteller: mockCurrentPlayer,
        hand: mockHand,
        playersStatus: mockPlayersStatus,
        action: {
          type: 'submit-clue',
          url: '/game/dev-game/clue',
          method: 'POST',
          label: 'Donner mon indice',
          disabled: false,
        },
      };
      return renderGamePreview(reply, 'Storytelling as Storyteller', view);
    },
  );

  // Storytelling as Guesser
  fastify.get('/dev/preview/storytelling-guesser', async (_request, reply) => {
    const view: StorytellingAsGuesserView = {
      _tag: 'StorytellingAsGuesser',
      gameId: 'dev-game',
      currentPlayer: mockCurrentPlayer,
      score: 5,
      turnNumber: 1,
      storyteller: mockStoryteller,
      hand: mockHand,
      playersStatus: mockPlayersStatus,
    };
    return renderGamePreview(reply, 'Storytelling as Guesser', view);
  });

  // Selecting Cards as Storyteller
  fastify.get('/dev/preview/selecting-storyteller', async (_request, reply) => {
    const view: SelectingCardsAsStorytellerView = {
      _tag: 'SelectingCardsAsStoryteller',
      gameId: 'dev-game',
      currentPlayer: mockCurrentPlayer,
      score: 0,
      turnNumber: 1,
      storyteller: mockCurrentPlayer,
      hand: mockHand,
      playersStatus: mockPlayersStatus,
      clue: 'Un voyage dans les étoiles',
    };
    return renderGamePreview(reply, 'Selecting Cards as Storyteller', view);
  });

  // Selecting Cards as Guesser
  fastify.get('/dev/preview/selecting-guesser', async (_request, reply) => {
    const view: SelectingCardsAsGuesserView = {
      _tag: 'SelectingCardsAsGuesser',
      gameId: 'dev-game',
      currentPlayer: mockCurrentPlayer,
      score: 5,
      turnNumber: 1,
      storyteller: mockStoryteller,
      hand: mockHand,
      playersStatus: mockPlayersStatus,
      clue: 'Un voyage dans les étoiles',
      hasSelectedCard: false,
      action: {
        type: 'select-card',
        url: '/game/dev-game/select-card',
        method: 'POST',
        label: 'Choisir cette carte',
        disabled: false,
      },
    };
    return renderGamePreview(reply, 'Selecting Cards as Guesser', view);
  });

  // Voting as Storyteller
  fastify.get('/dev/preview/voting-storyteller', async (_request, reply) => {
    const view: VotingAsStorytellerView = {
      _tag: 'VotingAsStoryteller',
      gameId: 'dev-game',
      currentPlayer: mockCurrentPlayer,
      score: 0,
      turnNumber: 1,
      storyteller: mockCurrentPlayer,
      hand: mockHand,
      playersStatus: mockPlayersStatus,
      clue: 'Un voyage dans les étoiles',
      boardCards: mockBoardCards,
    };
    return renderGamePreview(reply, 'Voting as Storyteller', view);
  });

  // Voting as Guesser
  fastify.get('/dev/preview/voting-guesser', async (_request, reply) => {
    const view: VotingAsGuesserView = {
      _tag: 'VotingAsGuesser',
      gameId: 'dev-game',
      currentPlayer: mockCurrentPlayer,
      score: 5,
      turnNumber: 1,
      storyteller: mockStoryteller,
      hand: mockHand,
      playersStatus: mockPlayersStatus,
      clue: 'Un voyage dans les étoiles',
      boardCards: mockBoardCards,
      hasVoted: false,
      ownCardId: 'card_201',
      action: {
        type: 'vote',
        url: '/game/dev-game/vote',
        method: 'POST',
        label: 'Voter',
        disabled: false,
      },
    };
    return renderGamePreview(reply, 'Voting as Guesser', view);
  });

  // Scoring
  fastify.get('/dev/preview/scoring', async (_request, reply) => {
    const view: ScoringView = {
      _tag: 'Scoring',
      gameId: 'dev-game',
      currentPlayer: mockCurrentPlayer,
      score: 8,
      turnNumber: 1,
      storyteller: mockStoryteller,
      hand: mockHand,
      playersStatus: mockPlayersStatus,
      clue: 'Un voyage dans les étoiles',
      boardCards: mockBoardCards,
      storytellerCardId: 'card_200',
      votes: {
        card_200: [mockCurrentPlayer, mockPlayer4],
        card_201: [mockPlayer3],
        card_202: [mockPlayer5, mockPlayer6],
      },
      pointsEarned: [
        { points: 3, reason: { _tag: 'YouFoundTheStorytellerCard' } },
      ],
      action: {
        type: 'ready',
        url: '/game/dev-game/ready',
        method: 'POST',
        label: 'Continuer',
        disabled: false,
      },
    };
    return renderGamePreview(reply, 'Scoring', view);
  });

  // Game Ended
  fastify.get('/dev/preview/ended', async (_request, reply) => {
    const view: EndedView = {
      _tag: 'Ended',
      gameId: 'dev-game',
      currentPlayer: mockCurrentPlayer,
      rankings: [
        { rank: 1, player: mockCurrentPlayer, score: 25 },
        { rank: 2, player: mockStoryteller, score: 20 },
        { rank: 3, player: mockPlayer3, score: 15 },
        { rank: 4, player: mockPlayer4, score: 12 },
        { rank: 5, player: mockPlayer5, score: 8 },
        { rank: 6, player: mockPlayer6, score: 5 },
      ],
      action: {
        type: 'back-to-lobby',
        url: '/lobby',
        method: 'GET',
        label: 'Retour au lobby',
        disabled: false,
      },
    };
    return renderGamePreview(reply, 'Game Ended', view);
  });
};

export default devPreviewRoutes;

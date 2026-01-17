import { Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { Game } from '../../view/components/Game.js';
import '../types.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:44321';

const buildCardUrl = (cardNumber: number) =>
  `${SUPABASE_URL}/storage/v1/object/public/decks/default/card_${cardNumber}.jpg`;

const gamePlayRoutes: FastifyPluginAsync = async (fastify) => {
  const { renderHtmlPage, renderToString } = fastify;

  // GET /game (stub)
  fastify.route({
    method: 'GET',
    url: '/',
    handler: async (request, reply) => {
      const cards = [100, 101, 102, 103, 104].map((n) => ({
        id: `card_${n}`,
        url: buildCardUrl(n),
      }));

      const component = h(Game, {
        points: 2,
        turn: 3,
        status: 'Waiting for the storyteller...',
        cards,
      });
      const body = renderToString(component);
      const html = renderHtmlPage('Game - Tixid Online', body, {
        isAuthenticated: Option.isSome(request.authUser),
      });

      return reply.type('text/html').send(html);
    },
  });
};

export default gamePlayRoutes;

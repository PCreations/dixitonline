import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { Game } from '../../view/components/Game.js';
import '../types.js';

const gamePlayRoutes: FastifyPluginAsync = async (fastify) => {
  const { renderHtmlPage, renderToString } = fastify;

  // GET /game (stub)
  fastify.route({
    method: 'GET',
    url: '/',
    handler: async (_request, reply) => {
      const component = h(Game, {
        points: 2,
        turn: 3,
        status: 'Waiting for the storyteller...',
      });
      const body = renderToString(component);
      const html = renderHtmlPage('Game - Tixid Online', body);

      return reply.type('text/html').send(html);
    },
  });
};

export default gamePlayRoutes;

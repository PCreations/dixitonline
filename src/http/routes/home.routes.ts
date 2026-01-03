import { Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { Home } from '../../view/components/Home.js';
import { Login } from '../../view/components/Login.js';
import '../types.js';

const homeRoutes: FastifyPluginAsync = async (fastify) => {
  const { renderHtmlPage, renderToString } = fastify;

  // GET /
  fastify.route({
    method: 'GET',
    url: '/',
    handler: async (request, reply) => {
      const user = Option.isSome(request.authUser)
        ? { username: request.authUser.value.username || 'Joueur' }
        : undefined;

      const component = h(Home, { user });
      const body = renderToString(component);
      const html = renderHtmlPage('Tixid Online', body, {
        isAuthenticated: Option.isSome(request.authUser),
      });

      return reply.type('text/html').send(html);
    },
  });

  // GET /login
  fastify.route({
    method: 'GET',
    url: '/login',
    handler: async (request, reply) => {
      const component = h(Login, {});
      const body = renderToString(component);
      const html = renderHtmlPage('Login - Tixid Online', body, {
        isAuthenticated: Option.isSome(request.authUser),
      });

      return reply.type('text/html').send(html);
    },
  });
};

export default homeRoutes;

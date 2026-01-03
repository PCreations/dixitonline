import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { renderHtmlPage, renderToString } from '../../view/render.js';

async function renderPlugin(fastify: FastifyInstance) {
  fastify.decorate('renderHtmlPage', renderHtmlPage);
  fastify.decorate('renderToString', renderToString);
}

export default fp(renderPlugin, {
  name: 'render',
  fastify: '5.x',
});

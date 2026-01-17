import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { GamePreview } from '../../view/components/GamePreview.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:44321';

const buildCardUrl = (cardNumber: number) =>
  `${SUPABASE_URL}/storage/v1/object/public/decks/default/card_${cardNumber}.jpg`;

// Mock cards using Supabase storage URLs
const mockCards = [100, 101, 102, 103, 104].map((n) => ({
  id: `card_${n}`,
  url: buildCardUrl(n),
}));

const devPreviewRoutes: FastifyPluginAsync = async (fastify) => {
  const { renderHtmlPage, renderToString } = fastify;

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

  // Helper function to render preview
  function renderPreview(
    reply: import('fastify').FastifyReply,
    title: string,
    status: string,
    points = 5,
    turn = 1,
  ) {
    const component = h(GamePreview, {
      points,
      turn,
      status,
      cards: mockCards,
    });
    const body = renderToString(component);
    const html = renderHtmlPage(`Preview: ${title} - Tixid Online`, body, {
      isAuthenticated: true,
    });
    return reply.type('text/html').send(html);
  }

  // Storytelling as Storyteller
  fastify.get(
    '/dev/preview/storytelling-storyteller',
    async (_request, reply) => {
      return renderPreview(
        reply,
        'Storytelling as Storyteller',
        "C'est ton tour ! Choisis une carte et donne un indice.",
        0,
        1,
      );
    },
  );

  // Storytelling as Guesser
  fastify.get('/dev/preview/storytelling-guesser', async (_request, reply) => {
    return renderPreview(
      reply,
      'Storytelling as Guesser',
      "En attente de l'indice d'Alice...",
      5,
      1,
    );
  });

  // Selecting Cards as Storyteller
  fastify.get('/dev/preview/selecting-storyteller', async (_request, reply) => {
    return renderPreview(
      reply,
      'Selecting Cards as Storyteller',
      'Les joueurs choisissent leurs cartes...',
      0,
      1,
    );
  });

  // Selecting Cards as Guesser
  fastify.get('/dev/preview/selecting-guesser', async (_request, reply) => {
    return renderPreview(
      reply,
      'Selecting Cards as Guesser',
      'Choisis une carte qui correspond à l\'indice "Un voyage dans les étoiles"',
      5,
      1,
    );
  });

  // Voting as Storyteller
  fastify.get('/dev/preview/voting-storyteller', async (_request, reply) => {
    return renderPreview(
      reply,
      'Voting as Storyteller',
      'Les joueurs votent...',
      0,
      1,
    );
  });

  // Voting as Guesser
  fastify.get('/dev/preview/voting-guesser', async (_request, reply) => {
    return renderPreview(
      reply,
      'Voting as Guesser',
      'Vote pour la carte du conteur !',
      5,
      1,
    );
  });

  // Scoring
  fastify.get('/dev/preview/scoring', async (_request, reply) => {
    return renderPreview(reply, 'Scoring', 'Résultats du tour', 8, 1);
  });

  // Game Ended
  fastify.get('/dev/preview/ended', async (_request, reply) => {
    return renderPreview(reply, 'Game Ended', 'Partie terminée !', 25, 5);
  });
};

export default devPreviewRoutes;

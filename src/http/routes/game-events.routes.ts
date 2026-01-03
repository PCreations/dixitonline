import { Effect, Option, Stream } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { matchGameEvent } from '../../game/game-events.js';
import { GameEventBus } from '../../game/index.js';
import { LobbyQueryService } from '../../game/lobby.query-service.js';
import { LobbyContent } from '../../view/components/LobbyContent.js';
import { createLobbyViewModel } from '../../view/view-models/lobby.view-model.js';
import type { GameParams } from '../types.js';
import '../types.js';

const gameEventsRoutes: FastifyPluginAsync = async (fastify) => {
  const { appRuntime, renderToString } = fastify;

  // GET /game/:gameId/events (SSE)
  fastify.route({
    method: 'GET',
    url: '/:gameId/events',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;

      if (Option.isNone(request.authUser)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const currentPlayerId = request.authUser.value.playerId;

      // Set SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      reply.raw.write(': connected\n\n');

      // Helper to render lobby content fragment
      const renderLobbyFragment = async (): Promise<string | null> => {
        const program = Effect.gen(function* () {
          const lobbyQueryService = yield* LobbyQueryService;
          const maybeLobbyState =
            yield* lobbyQueryService.getLobbyState(gameId);

          if (Option.isNone(maybeLobbyState)) {
            return null;
          }

          const viewModel = createLobbyViewModel(maybeLobbyState.value, {
            currentPlayerId,
          });

          return renderToString(h(LobbyContent, viewModel));
        });

        return appRuntime.runPromise(program);
      };

      // Subscribe to game events
      const subscribeProgram = Effect.gen(function* () {
        const eventBus = yield* GameEventBus;
        return eventBus.subscribe(gameId);
      });

      const eventStream = await appRuntime.runPromise(subscribeProgram);

      // Handle client disconnect
      let isConnected = true;
      request.raw.on('close', () => {
        isConnected = false;
      });

      // Process events from the stream
      const processEvents = async () => {
        const runStream = Stream.runForEach(eventStream, (event) =>
          Effect.gen(function* () {
            if (!isConnected) {
              return;
            }

            yield* matchGameEvent(event, {
              GameStarted: () =>
                Effect.sync(() => {
                  const data = `<script>window.location.href='/game/${gameId}/play'</script>`;
                  reply.raw.write(`event: gameStarted\ndata: ${data}\n\n`);
                }),
              PlayerJoined: () => sendLobbyUpdate('playerJoined'),
              PlayerLeft: () => sendLobbyUpdate('playerLeft'),
              ClueSubmitted: () => Effect.void,
              CardSelected: () => Effect.void,
              VoteSubmitted: () => Effect.void,
              TurnScored: () => Effect.void,
              GameEnded: () => Effect.void,
            });

            function sendLobbyUpdate(eventName: string) {
              return Effect.gen(function* () {
                const html = yield* Effect.promise(() => renderLobbyFragment());
                if (html) {
                  const encodedHtml = html.replace(/\n/g, '');
                  reply.raw.write(
                    `event: ${eventName}\ndata: ${encodedHtml}\n\n`,
                  );
                }
              });
            }
          }),
        );

        await appRuntime.runPromise(runStream).catch((error) => {
          if (isConnected) {
            // @ts-ignore - pino type issue
            request.log.error({ err: error }, 'SSE stream error');
          }
        });
      };

      processEvents();
    },
  });
};

export default gameEventsRoutes;

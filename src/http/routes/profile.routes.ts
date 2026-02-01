import { Effect, Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { PlayerId, UpdateUsernameUseCase } from '../../player/index.js';
import { ProfilePage } from '../../view/components/profile/ProfilePage.js';
import { createProfileViewModel } from '../../view/view-models/profile.view-model.js';
import '../types.js';

interface UpdateUsernameBody {
  username: string;
}

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  const { appRuntime, renderHtmlPage, renderToString } = fastify;

  // GET /profile
  fastify.route({
    method: 'GET',
    url: '/profile',
    handler: async (request, reply) => {
      // Redirect to login if not authenticated
      if (Option.isNone(request.authUser)) {
        return reply.redirect('/login?redirect=/profile');
      }

      const authUser = request.authUser.value;
      const username = authUser.username ?? 'Anonymous';

      const viewModel = createProfileViewModel({ username });

      const component = h(ProfilePage, { vm: viewModel });
      const body = renderToString(component);
      const html = renderHtmlPage('Profile - Tixid Online', body, {
        isAuthenticated: true,
      });

      return reply.type('text/html').send(html);
    },
  });

  // POST /profile/username - Update username with uniqueness check
  fastify.route<{ Body: UpdateUsernameBody }>({
    method: 'POST',
    url: '/profile/username',
    handler: async (request, reply) => {
      if (Option.isNone(request.authUser)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { username: newUsername } = request.body;
      const playerId = PlayerId(request.authUser.value.playerId);

      // Validate input
      if (!newUsername || newUsername.length < 2 || newUsername.length > 20) {
        return reply.status(400).send({
          error: 'InvalidUsername',
          message: 'Le pseudo doit contenir entre 2 et 20 caractères',
        });
      }

      const program = Effect.gen(function* () {
        const updateUsernameUseCase = yield* UpdateUsernameUseCase;
        yield* updateUsernameUseCase.execute({ playerId, newUsername });
        return { success: true };
      });

      return appRuntime
        .runPromise(program)
        .then((result) => reply.send(result))
        .catch((error) => {
          const tag = error?._tag;

          if (tag === 'UsernameAlreadyTakenError') {
            return reply.status(409).send({
              error: 'UsernameAlreadyTaken',
              message: `Le pseudo "${error.username}" est déjà pris`,
            });
          }

          if (tag === 'PlayerNotFoundError') {
            return reply.status(404).send({
              error: 'PlayerNotFound',
              message: 'Joueur non trouvé',
            });
          }

          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to update username');
          return reply.status(500).send({
            error: 'InternalError',
            message: 'Erreur lors de la mise à jour du pseudo',
          });
        });
    },
  });
};

export default profileRoutes;

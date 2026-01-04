import { Effect } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { CheckUsernameAvailabilityUseCase } from '../../player/index.js';
import '../types.js';

interface CheckUsernameQuery {
  username?: string;
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const { appRuntime } = fastify;

  // GET /api/auth/check-username?username=Pierre
  fastify.route({
    method: 'GET',
    url: '/check-username',
    handler: async (request, reply) => {
      const { username } = request.query as CheckUsernameQuery;

      if (!username || username.length < 2 || username.length > 20) {
        return reply.status(400).send({
          error: 'Invalid username',
          message: 'Le pseudo doit contenir entre 2 et 20 caractères',
        });
      }

      const program = Effect.gen(function* () {
        const useCase = yield* CheckUsernameAvailabilityUseCase;
        return yield* useCase.execute(username);
      });

      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    },
  });
};

export default authRoutes;

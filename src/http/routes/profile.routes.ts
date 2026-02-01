import { Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { ProfilePage } from '../../view/components/profile/ProfilePage.js';
import { createProfileViewModel } from '../../view/view-models/profile.view-model.js';
import '../types.js';

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  const { renderHtmlPage, renderToString } = fastify;

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
};

export default profileRoutes;

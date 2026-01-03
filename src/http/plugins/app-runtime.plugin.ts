import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { AppRuntime } from '../types.js';

export interface AppRuntimePluginOptions {
  readonly appRuntime: AppRuntime;
}

async function appRuntimePlugin(
  fastify: FastifyInstance,
  options: AppRuntimePluginOptions,
) {
  fastify.decorate('appRuntime', options.appRuntime);

  fastify.addHook('onClose', async () => {
    console.log('Server shutting down, disposing ManagedRuntime...');
    await options.appRuntime.dispose();
    console.log('ManagedRuntime disposed, database connections cleaned up');
  });
}

export default fp(appRuntimePlugin, {
  name: 'app-runtime',
  fastify: '5.x',
});

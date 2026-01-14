import type { ManagedRuntime } from 'effect';
import type { VNode } from 'preact';

import type { RenderHtmlPageOptions } from '../view/render.js';

// Re-export types for use in route plugins
export interface CreateGameFormBody {
  endConditionType?: string;
  numberOfTimes?: string;
  limitOfPoints?: string;
}

export interface GameParams {
  gameId: string;
}

// Type for the app layer - we use a generic type to avoid circular imports
// The actual type is inferred from the AppLayer in server.ts
// biome-ignore lint/suspicious/noExplicitAny: AppLayer type is complex and defined in server.ts
export type AppRuntime = ManagedRuntime.ManagedRuntime<any, never>;

// Fastify instance extensions
declare module 'fastify' {
  interface FastifyInstance {
    appRuntime: AppRuntime;
    renderHtmlPage: (
      title: string,
      body: string,
      options?: RenderHtmlPageOptions,
    ) => string;
    // biome-ignore lint/suspicious/noExplicitAny: VNode props vary by component
    renderToString: (component: VNode<any>) => string;
  }
}

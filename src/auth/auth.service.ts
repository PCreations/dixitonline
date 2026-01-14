import { Context, Layer } from 'effect';

import type { PlayerId } from '../player/player.entity.js';

export interface AuthUser {
  readonly playerId: PlayerId;
  readonly username: string | undefined;
  readonly isAnonymous: boolean;
}

export class CurrentUser extends Context.Tag('auth/CurrentUser')<
  CurrentUser,
  AuthUser
>() {}

export const makeCurrentUserLayer = (
  user: AuthUser,
): Layer.Layer<CurrentUser> => Layer.succeed(CurrentUser, user);

import { Brand } from 'effect';

export type PlayerId = string & Brand.Brand<'PlayerId'>;

export const PlayerId = Brand.nominal<PlayerId>();

import { Set } from 'immutable';
import { Card } from './Card';

export type Hand = { cards: Set<Card>; shuffle: () => Hand };

import { objectType, enumType } from 'nexus';
import { TurnPhase as DomainTurnPhase } from '../../../domain/turn';
import { Card } from './card';

export const TurnPhaseName = enumType({
  name: 'TurnPhaseName',
  members: DomainTurnPhase,
});

export const TurnPhase = objectType({
  name: 'TurnPhase',
  definition(t) {
    t.field('name', { type: TurnPhaseName });
    t.id('storytellerId');
    t.list.field('hand', {
      type: Card,
    });
  },
});

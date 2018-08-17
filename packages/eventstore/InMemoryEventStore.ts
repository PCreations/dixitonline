import { EventStore, DomainEvent, EventsSet } from './EventStore';
import { Map, OrderedSet } from 'immutable';

export const InMemoryEventStore = (): EventStore => {
  let eventsMap: Map<string, EventsSet> = Map({});
  return {
    async appendEventsToStream(streamName, events) {
      events.forEach(event => {
        eventsMap = eventsMap.update(streamName, OrderedSet<DomainEvent>(), events => events.add(event));
      });
    },
    async getStream(streamName) {
      return eventsMap.get(streamName);
    },
  };
};

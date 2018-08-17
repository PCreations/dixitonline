import { v4 as uuid } from 'uuid';
import { OrderedSet } from 'immutable';

export class EventId {
  private readonly value: string;
  constructor() {
    this.value = uuid();
  }
  getValue() {
    return this.value;
  }
}

export class DomainEvent {
  private readonly id: EventId = new EventId();
  getId(): EventId {
    return this.id;
  }
}

export type EventsSet = OrderedSet<DomainEvent>;

export type EventStore = {
  appendEventsToStream(streamName: string, events: DomainEvent[]): Promise<void>;
  getStream(streamName: string): Promise<EventsSet>;
};

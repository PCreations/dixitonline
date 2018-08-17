import { DomainEvent } from '../EventStore';
import { InMemoryEventStore } from '../InMemoryEventStore';

class TestEvent extends DomainEvent {
  constructor(public bar: number) {
    super();
  }
}

describe('given an event stream named "foo"', () => {
  describe('when a test event is saved', () => {
    test('then the test event is persisted and thus can be retrieved', async done => {
      const eventStore = InMemoryEventStore();
      const streamName = 'foo';
      const testEvents: DomainEvent[] = [new TestEvent(0), new TestEvent(1), new TestEvent(2)];
      await eventStore.appendEventsToStream(streamName, testEvents);
      const eventStream = await eventStore.getStream(streamName);
      expect(testEvents.every(eventStream.contains.bind(eventStream))).toBe(true);
      expect(eventStream.size).toBe(3);
      done();
    });
  });
});

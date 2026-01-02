import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import { PlayerEntity } from "../player.entity.js";

describe("PlayerEntity", () => {
  describe("createFromAuth", () => {
    it("should create an anonymous player without email", () => {
      const player = PlayerEntity.createFromAuth({
        id: "player-1",
        username: "Alice",
        isAnonymous: true,
      });

      const snapshot = player.toSnapshot();
      expect(snapshot.id).toBe("player-1");
      expect(snapshot.username).toBe("Alice");
      expect(snapshot.email).toBeNull();
      expect(snapshot.isAnonymous).toBe(true);
      expect(snapshot.createdAt).toBeInstanceOf(Date);
      expect(snapshot.updatedAt).toBeInstanceOf(Date);
    });

    it("should create a non-anonymous player with email", () => {
      const player = PlayerEntity.createFromAuth({
        id: "player-2",
        username: "Bob",
        email: "bob@example.com",
        isAnonymous: false,
      });

      const snapshot = player.toSnapshot();
      expect(snapshot.id).toBe("player-2");
      expect(snapshot.username).toBe("Bob");
      expect(snapshot.email).toBe("bob@example.com");
      expect(snapshot.isAnonymous).toBe(false);
    });
  });

  describe("updateUsername", () => {
    it("should return the same instance if username unchanged", () => {
      const player = PlayerEntity.createFromAuth({
        id: "player-1",
        username: "Alice",
        isAnonymous: true,
      });

      const updated = player.updateUsername("Alice");

      expect(updated).toBe(player);
    });

    it("should return a new instance with updated username", () => {
      const player = PlayerEntity.createFromAuth({
        id: "player-1",
        username: "Alice",
        isAnonymous: true,
      });

      const updated = player.updateUsername("Alicia");

      expect(updated).not.toBe(player);
      expect(updated.toSnapshot().username).toBe("Alicia");
      expect(player.toSnapshot().username).toBe("Alice");
    });
  });

  describe("linkEmail", () => {
    it.effect(
      "should link email and set isAnonymous to false for anonymous player",
      () =>
        Effect.gen(function* () {
          const player = PlayerEntity.createFromAuth({
            id: "player-1",
            username: "Alice",
            isAnonymous: true,
          });

          const updated = yield* player.linkEmail("alice@example.com");

          const snapshot = updated.toSnapshot();
          expect(snapshot.email).toBe("alice@example.com");
          expect(snapshot.isAnonymous).toBe(false);
        }),
    );

    it.effect("should fail if email already linked", () =>
      Effect.gen(function* () {
        const player = PlayerEntity.createFromAuth({
          id: "player-1",
          username: "Alice",
          email: "alice@example.com",
          isAnonymous: false,
        });

        const result = yield* player
          .linkEmail("newemail@example.com")
          .pipe(Effect.exit);

        expect(Exit.isFailure(result)).toBe(true);
      }),
    );
  });

  describe("fromSnapshot / toSnapshot", () => {
    it("should roundtrip correctly", () => {
      const original = PlayerEntity.createFromAuth({
        id: "player-1",
        username: "Alice",
        email: "alice@example.com",
        isAnonymous: false,
      });

      const snapshot = original.toSnapshot();
      const restored = PlayerEntity.fromSnapshot(snapshot);

      expect(restored.toSnapshot()).toEqual(snapshot);
    });

    it("should roundtrip correctly with null email", () => {
      const original = PlayerEntity.createFromAuth({
        id: "player-1",
        username: "Alice",
        isAnonymous: true,
      });

      const snapshot = original.toSnapshot();
      const restored = PlayerEntity.fromSnapshot(snapshot);

      expect(restored.toSnapshot()).toEqual(snapshot);
    });
  });
});

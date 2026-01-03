import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { PlayerSnapshotSchema } from "./player-snapshot.schema.js";

describe("PlayerSnapshotSchema", () => {
  // Schema.DateFromSelf expects Date objects directly (no string transformation)
  const testDate = new Date("2024-01-01T00:00:00.000Z");

  const validSnapshot = {
    id: "test-player-id",
    username: "TestPlayer",
    email: "test@example.com",
    isAnonymous: false,
    version: 1,
    createdAt: testDate,
    updatedAt: testDate,
  };

  const anonymousSnapshot = {
    id: "anonymous-player-id",
    username: "Anonymous",
    email: null,
    isAnonymous: true,
    version: 1,
    createdAt: testDate,
    updatedAt: testDate,
  };

  it("should decode a valid player snapshot with email", () => {
    const result = Schema.decodeUnknownSync(PlayerSnapshotSchema)(validSnapshot);

    expect(result.id).toBe("test-player-id");
    expect(result.username).toBe("TestPlayer");
    expect(result.email).toBe("test@example.com");
    expect(result.isAnonymous).toBe(false);
    expect(result.version).toBe(1);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should decode a valid anonymous player snapshot with null email", () => {
    const result = Schema.decodeUnknownSync(PlayerSnapshotSchema)(anonymousSnapshot);

    expect(result.id).toBe("anonymous-player-id");
    expect(result.username).toBe("Anonymous");
    expect(result.email).toBe(null);
    expect(result.isAnonymous).toBe(true);
    expect(result.version).toBe(1);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should keep Date objects as-is (no transformation)", () => {
    const decoded = Schema.decodeUnknownSync(PlayerSnapshotSchema)(validSnapshot);
    const encoded = Schema.encodeSync(PlayerSnapshotSchema)(decoded);

    expect(encoded.id).toBe(validSnapshot.id);
    expect(encoded.username).toBe(validSnapshot.username);
    expect(encoded.email).toBe(validSnapshot.email);
    expect(encoded.isAnonymous).toBe(validSnapshot.isAnonymous);
    expect(encoded.version).toBe(validSnapshot.version);
    // DateFromSelf keeps Date objects as-is
    expect(encoded.createdAt).toBeInstanceOf(Date);
    expect(encoded.updatedAt).toBeInstanceOf(Date);
  });

  it("should fail on invalid data - missing required field", () => {
    const invalidSnapshot = {
      id: "test-id",
      // missing username
      email: null,
      isAnonymous: true,
      version: 1,
      createdAt: testDate,
      updatedAt: testDate,
    };

    expect(() =>
      Schema.decodeUnknownSync(PlayerSnapshotSchema)(invalidSnapshot)
    ).toThrow();
  });

  it("should fail on invalid data - wrong type for version", () => {
    const invalidSnapshot = {
      ...validSnapshot,
      version: "not-a-number",
    };

    expect(() =>
      Schema.decodeUnknownSync(PlayerSnapshotSchema)(invalidSnapshot)
    ).toThrow();
  });

  it("should fail on invalid data - wrong type for isAnonymous", () => {
    const invalidSnapshot = {
      ...validSnapshot,
      isAnonymous: "not-a-boolean",
    };

    expect(() =>
      Schema.decodeUnknownSync(PlayerSnapshotSchema)(invalidSnapshot)
    ).toThrow();
  });
});

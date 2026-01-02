import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { PlayerSnapshotSchema } from "./player-snapshot.schema.js";

describe("PlayerSnapshotSchema", () => {
  // Schema.Date expects string input for decoding (ISO date string)
  // and outputs Date objects
  const validEncodedSnapshot = {
    id: "test-player-id",
    username: "TestPlayer",
    email: "test@example.com",
    isAnonymous: false,
    version: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const anonymousEncodedSnapshot = {
    id: "anonymous-player-id",
    username: "Anonymous",
    email: null,
    isAnonymous: true,
    version: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  it("should decode a valid player snapshot with email", () => {
    const result = Schema.decodeUnknownSync(PlayerSnapshotSchema)(validEncodedSnapshot);

    expect(result.id).toBe("test-player-id");
    expect(result.username).toBe("TestPlayer");
    expect(result.email).toBe("test@example.com");
    expect(result.isAnonymous).toBe(false);
    expect(result.version).toBe(1);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should decode a valid anonymous player snapshot with null email", () => {
    const result = Schema.decodeUnknownSync(PlayerSnapshotSchema)(anonymousEncodedSnapshot);

    expect(result.id).toBe("anonymous-player-id");
    expect(result.username).toBe("Anonymous");
    expect(result.email).toBe(null);
    expect(result.isAnonymous).toBe(true);
    expect(result.version).toBe(1);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should encode a snapshot back to string dates", () => {
    const decoded = Schema.decodeUnknownSync(PlayerSnapshotSchema)(validEncodedSnapshot);
    const encoded = Schema.encodeSync(PlayerSnapshotSchema)(decoded);

    expect(encoded.id).toBe(validEncodedSnapshot.id);
    expect(encoded.username).toBe(validEncodedSnapshot.username);
    expect(encoded.email).toBe(validEncodedSnapshot.email);
    expect(encoded.isAnonymous).toBe(validEncodedSnapshot.isAnonymous);
    expect(encoded.version).toBe(validEncodedSnapshot.version);
    expect(typeof encoded.createdAt).toBe("string");
    expect(typeof encoded.updatedAt).toBe("string");
  });

  it("should fail on invalid data - missing required field", () => {
    const invalidSnapshot = {
      id: "test-id",
      // missing username
      email: null,
      isAnonymous: true,
      version: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    expect(() =>
      Schema.decodeUnknownSync(PlayerSnapshotSchema)(invalidSnapshot)
    ).toThrow();
  });

  it("should fail on invalid data - wrong type for version", () => {
    const invalidSnapshot = {
      ...validEncodedSnapshot,
      version: "not-a-number",
    };

    expect(() =>
      Schema.decodeUnknownSync(PlayerSnapshotSchema)(invalidSnapshot)
    ).toThrow();
  });

  it("should fail on invalid data - wrong type for isAnonymous", () => {
    const invalidSnapshot = {
      ...validEncodedSnapshot,
      isAnonymous: "not-a-boolean",
    };

    expect(() =>
      Schema.decodeUnknownSync(PlayerSnapshotSchema)(invalidSnapshot)
    ).toThrow();
  });
});

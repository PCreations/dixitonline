import { Effect, Either, Option } from 'effect';
import { PlayerEntity, PlayerId } from '../../player.entity.js';
import { OptimisticConcurrencyError } from '../../player.repository.js';
import { playersTable } from '../../../infra/db/schema.js';
import { getTestDb } from '../../../shared/tests/setup/test-db.js';
import { playerId } from '../../../shared/tests/uuid-test-helper.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeDrizzlePlayerRepository } from './drizzle-player.repository.js';

describe('DrizzlePlayerRepository', () => {
  beforeEach(async () => {
    // Clean the database before each test
    const db = getTestDb();
    await db.delete(playersTable);
  });

  it('should save a new player', async () => {
    const player = PlayerEntity.createFromAuth({
      id: playerId(1),
      username: 'Alice',
      email: 'alice@example.com',
      isAnonymous: false,
    });

    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    // Save the player
    const result = await Effect.runPromise(playerRepository.save(player));

    // Verify the player was saved successfully (no error thrown)
    expect(result).toBeUndefined();
  });

  it('should save an anonymous player without email', async () => {
    const player = PlayerEntity.createFromAuth({
      id: playerId(2),
      username: 'Anonymous User',
      isAnonymous: true,
    });

    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    // Save the player
    const result = await Effect.runPromise(playerRepository.save(player));

    // Verify the player was saved successfully
    expect(result).toBeUndefined();
  });

  it('should update an existing player', async () => {
    // Create initial player
    const initialPlayer = PlayerEntity.createFromAuth({
      id: playerId(3),
      username: 'Bob',
      isAnonymous: true,
    });

    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    // Save initial player
    await Effect.runPromise(playerRepository.save(initialPlayer));

    // Update the player - change username and increment version
    const updatedPlayer = initialPlayer.updateUsername('Bob Updated');

    // Save updated player
    const result = await Effect.runPromise(playerRepository.save(updatedPlayer));

    // Verify the update was successful
    expect(result).toBeUndefined();

    // Verify the player was actually updated in DB
    const foundPlayer = await Effect.runPromise(
      playerRepository.findById(PlayerId(playerId(3))),
    );

    expect(Option.isSome(foundPlayer)).toBe(true);
    if (Option.isSome(foundPlayer)) {
      expect(foundPlayer.value.toSnapshot().username).toBe('Bob Updated');
      expect(foundPlayer.value.version).toBe(2);
    }
  });

  it('should throw OptimisticConcurrencyError when version mismatch occurs', async () => {
    // Create initial player
    const initialPlayer = PlayerEntity.createFromAuth({
      id: playerId(4),
      username: 'Charlie',
      isAnonymous: true,
    });

    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    // Save initial player (version 1)
    await Effect.runPromise(playerRepository.save(initialPlayer));

    // Try to save the player again with version 1 (should fail because version 1 already exists)
    // The conflict update will check WHERE version = 0, but the DB has version = 1
    const conflictingPlayer = PlayerEntity.createFromAuth({
      id: playerId(4),
      username: 'Charlie Conflicting',
      isAnonymous: true,
    });

    // Verify that OptimisticConcurrencyError is thrown
    const result = await Effect.runPromise(
      Effect.either(playerRepository.save(conflictingPlayer)),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(OptimisticConcurrencyError);
      expect((result.left as OptimisticConcurrencyError).playerId).toBe(
        playerId(4),
      );
    }
  });

  it('should find a player by id', async () => {
    const player = PlayerEntity.createFromAuth({
      id: playerId(5),
      username: 'Diana',
      email: 'diana@example.com',
      isAnonymous: false,
    });

    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    // Save the player
    await Effect.runPromise(playerRepository.save(player));

    // Find the player by id
    const foundPlayer = await Effect.runPromise(
      playerRepository.findById(PlayerId(playerId(5))),
    );

    expect(Option.isSome(foundPlayer)).toBe(true);
    if (Option.isSome(foundPlayer)) {
      expect(foundPlayer.value.id).toBe(playerId(5));
      expect(foundPlayer.value.toSnapshot().username).toBe('Diana');
      expect(foundPlayer.value.toSnapshot().email).toBe('diana@example.com');
      expect(foundPlayer.value.toSnapshot().isAnonymous).toBe(false);
      expect(foundPlayer.value.version).toBe(1);
    }
  });

  it('should return None when player not found', async () => {
    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    const foundPlayer = await Effect.runPromise(
      playerRepository.findById(PlayerId(playerId(999))),
    );

    expect(Option.isNone(foundPlayer)).toBe(true);
  });

  it('should find multiple players by ids', async () => {
    const player1 = PlayerEntity.createFromAuth({
      id: playerId(6),
      username: 'Eve',
      isAnonymous: true,
    });

    const player2 = PlayerEntity.createFromAuth({
      id: playerId(7),
      username: 'Frank',
      email: 'frank@example.com',
      isAnonymous: false,
    });

    const player3 = PlayerEntity.createFromAuth({
      id: playerId(8),
      username: 'Grace',
      isAnonymous: true,
    });

    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    // Save all players
    await Effect.runPromise(playerRepository.save(player1));
    await Effect.runPromise(playerRepository.save(player2));
    await Effect.runPromise(playerRepository.save(player3));

    // Find multiple players by ids
    const foundPlayers = await Effect.runPromise(
      playerRepository.findByIds([
        PlayerId(playerId(6)),
        PlayerId(playerId(7)),
        PlayerId(playerId(8)),
      ]),
    );

    expect(foundPlayers.size).toBe(3);
    expect(foundPlayers.has(PlayerId(playerId(6)))).toBe(true);
    expect(foundPlayers.has(PlayerId(playerId(7)))).toBe(true);
    expect(foundPlayers.has(PlayerId(playerId(8)))).toBe(true);

    const foundPlayer6 = foundPlayers.get(PlayerId(playerId(6)));
    expect(foundPlayer6?.toSnapshot().username).toBe('Eve');

    const foundPlayer7 = foundPlayers.get(PlayerId(playerId(7)));
    expect(foundPlayer7?.toSnapshot().username).toBe('Frank');
    expect(foundPlayer7?.toSnapshot().email).toBe('frank@example.com');
  });

  it('should return partial results when some players are not found', async () => {
    const player1 = PlayerEntity.createFromAuth({
      id: playerId(9),
      username: 'Henry',
      isAnonymous: true,
    });

    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    // Save only player 9
    await Effect.runPromise(playerRepository.save(player1));

    // Try to find players 9, 10, and 11 (only 9 exists)
    const foundPlayers = await Effect.runPromise(
      playerRepository.findByIds([
        PlayerId(playerId(9)),
        PlayerId(playerId(10)),
        PlayerId(playerId(11)),
      ]),
    );

    expect(foundPlayers.size).toBe(1);
    expect(foundPlayers.has(PlayerId(playerId(9)))).toBe(true);
    expect(foundPlayers.has(PlayerId(playerId(10)))).toBe(false);
    expect(foundPlayers.has(PlayerId(playerId(11)))).toBe(false);
  });

  it('should return empty map when findByIds is called with empty array', async () => {
    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    const foundPlayers = await Effect.runPromise(
      playerRepository.findByIds([]),
    );

    expect(foundPlayers.size).toBe(0);
  });

  it('should return empty map when no players match the ids', async () => {
    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    const foundPlayers = await Effect.runPromise(
      playerRepository.findByIds([
        PlayerId(playerId(100)),
        PlayerId(playerId(101)),
      ]),
    );

    expect(foundPlayers.size).toBe(0);
  });

  it('should handle linking email to anonymous player', async () => {
    // Create anonymous player
    const anonymousPlayer = PlayerEntity.createFromAuth({
      id: playerId(12),
      username: 'Anonymous_12',
      isAnonymous: true,
    });

    const db = getTestDb();
    const playerRepository = makeDrizzlePlayerRepository({ db });

    // Save anonymous player
    await Effect.runPromise(playerRepository.save(anonymousPlayer));

    // Link email
    const playerWithEmail = await Effect.runPromise(
      anonymousPlayer.linkEmail('user12@example.com'),
    );

    // Save updated player
    await Effect.runPromise(playerRepository.save(playerWithEmail));

    // Verify the email was linked
    const foundPlayer = await Effect.runPromise(
      playerRepository.findById(PlayerId(playerId(12))),
    );

    expect(Option.isSome(foundPlayer)).toBe(true);
    if (Option.isSome(foundPlayer)) {
      const snapshot = foundPlayer.value.toSnapshot();
      expect(snapshot.email).toBe('user12@example.com');
      expect(snapshot.isAnonymous).toBe(false);
      expect(foundPlayer.value.version).toBe(2);
    }
  });
});

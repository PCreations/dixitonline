/**
 * Helper functions to generate predictable UUIDs for tests
 * These helpers make tests more readable while ensuring valid UUID format
 */

/**
 * Pads a number to create a valid UUID segment
 */
function padUuid(prefix: string, id: string | number): string {
  const idStr = String(id).padStart(12, '0');
  return `${prefix}-0000-0000-0000-${idStr}`;
}

/**
 * Generates a game UUID
 * @example gameId(1) => "00000000-0000-0000-0000-000000000001"
 */
export function gameId(id: string | number): string {
  return padUuid('00000000', id);
}

/**
 * Generates a player UUID
 * @example playerId(1) => "10000000-0000-0000-0000-000000000001"
 */
export function playerId(id: string | number): string {
  return padUuid('10000000', id);
}

/**
 * Generates a deck UUID
 * @example deckId(1) => "20000000-0000-0000-0000-000000000001"
 */
export function deckId(id: string | number): string {
  return padUuid('20000000', id);
}

/**
 * Generates a turn UUID
 * @example turnId(1) => "30000000-0000-0000-0000-000000000001"
 */
export function turnId(id: string | number): string {
  return padUuid('30000000', id);
}

/**
 * Generates a card UUID
 * @example cardId(1) => "40000000-0000-0000-0000-000000000001"
 */
export function cardId(id: string | number): string {
  return padUuid('40000000', id);
}

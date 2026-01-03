/**
 * Helper functions to generate predictable UUIDs for tests
 * These helpers make tests more readable while ensuring valid UUID format
 */

/**
 * Simple hash function to convert a string to a hex string
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Use absolute value and convert to hex, pad to 12 chars
  return Math.abs(hash).toString(16).padStart(12, '0').slice(-12);
}

/**
 * Pads a number or string to create a valid UUID segment
 */
function padUuid(prefix: string, id: string | number): string {
  if (typeof id === 'number') {
    const idStr = String(id).padStart(12, '0');
    return `${prefix}-0000-0000-0000-${idStr}`;
  }
  // For strings, check if it's purely numeric
  if (/^\d+$/.test(id)) {
    const idStr = id.padStart(12, '0');
    return `${prefix}-0000-0000-0000-${idStr}`;
  }
  // For non-numeric strings, hash them to get valid hex
  const hexId = hashString(id);
  return `${prefix}-0000-0000-0000-${hexId}`;
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

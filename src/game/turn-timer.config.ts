/**
 * Configuration for turn timer timeouts.
 * Each player has 30 seconds to perform their action.
 */
export const TURN_TIMER_CONFIG = {
  /**
   * Timeout in milliseconds for each player action.
   * When expired, an automatic action is performed for the player.
   */
  playerActionTimeoutMs: 30_000, // 30 seconds
} as const;

/** @jsx h */
import { h } from 'preact';

interface TurnTimerBarProps {
  /** ISO timestamp of the deadline, or undefined if no timer */
  readonly deadline: string | undefined;
  /** Timer duration in milliseconds (default: 30000) */
  readonly durationMs?: number;
}

/**
 * Fixed progress bar at the bottom of the screen showing remaining time.
 * Uses Alpine.js for client-side countdown animation.
 * Synchronizes with server deadline timestamp.
 */
export function TurnTimerBar({
  deadline,
  durationMs = 30000,
}: TurnTimerBarProps) {
  if (!deadline) {
    return null;
  }

  // Alpine.js component data and behavior
  const alpineData = `{
    deadline: new Date('${deadline}'),
    durationMs: ${durationMs},
    percentRemaining: 100,
    secondsRemaining: ${Math.ceil(durationMs / 1000)},
    interval: null,

    init() {
      this.updateProgress();
      this.interval = setInterval(() => this.updateProgress(), 100);
    },

    updateProgress() {
      const now = Date.now();
      const deadlineTime = this.deadline.getTime();
      const remaining = Math.max(0, deadlineTime - now);

      this.percentRemaining = Math.max(0, (remaining / this.durationMs) * 100);
      this.secondsRemaining = Math.ceil(remaining / 1000);

      if (remaining <= 0 && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },

    destroy() {
      if (this.interval) {
        clearInterval(this.interval);
      }
    }
  }`;

  const containerAttrs = {
    'x-data': alpineData,
    'x-init': 'init()',
    'x-on:htmx:before-swap.window': 'destroy()',
  };

  const progressAttrs = {
    'x-bind:style': `'width: ' + percentRemaining + '%'`,
    'x-bind:class': `{
      'turn-timer-bar__progress--warning': percentRemaining <= 33 && percentRemaining > 10,
      'turn-timer-bar__progress--danger': percentRemaining <= 10
    }`,
  };

  const timeAttrs = {
    'x-text': `secondsRemaining + 's'`,
  };

  return (
    <div className="turn-timer-bar" {...containerAttrs}>
      <div className="turn-timer-bar__track">
        <div className="turn-timer-bar__progress" {...progressAttrs} />
      </div>
      <div className="turn-timer-bar__time" {...timeAttrs} />
    </div>
  );
}

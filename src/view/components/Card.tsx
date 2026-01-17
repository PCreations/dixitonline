/** @jsx h */
import { h } from 'preact';
import { CardBack } from './CardBack.js';

interface CardProps {
  id?: string;
  url?: string;
  /** Index in the fan (0-based) */
  index?: number;
  /** Total cards in the fan */
  total?: number;
  /** Optional content to display in the modal (replaces default "Choose this card" button) */
  modalContent?: h.JSX.Element;
}

/**
 * Calculate fan transform based on position
 */
function getFanTransform(
  index: number,
  total: number,
): { transform: string; zIndex: number } {
  // Position from center: -1 = far left, 0 = center, 1 = far right
  const center = (total - 1) / 2;
  const offset = index - center;
  const maxOffset = center || 1;

  // Normalize offset to -1...1 range
  const normalizedOffset = offset / maxOffset;

  // Calculate rotation (-15 to 15 degrees)
  const rotation = normalizedOffset * 15;

  // Calculate scale (1 at center, 0.8 at edges)
  const scale = 1 - Math.abs(normalizedOffset) * 0.2;

  // Calculate vertical offset (0 at center, 30px at edges)
  const translateY = Math.abs(normalizedOffset) * 30;

  // Z-index: higher for center cards
  const zIndex = Math.round((1 - Math.abs(normalizedOffset)) * 10);

  return {
    transform: `scale(${scale.toFixed(2)}) rotate(${rotation.toFixed(1)}deg) translateY(${translateY.toFixed(0)}px)`,
    zIndex,
  };
}

export function Card({ id, url, index, total, modalContent }: CardProps) {
  const showFront = !!url;

  // Calculate fan transform if index and total are provided
  const fanStyle =
    index !== undefined && total !== undefined
      ? getFanTransform(index, total)
      : undefined;

  return (
    <div className="card-wrapper" x-data="{ modalOpen: false }">
      <div className="card-action-label">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="white"
          />
        </svg>
        Choose this card
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="white"
          />
        </svg>
      </div>

      <div
        className="card"
        x-on:click="modalOpen = ! modalOpen"
        style={fanStyle ? { transform: fanStyle.transform, zIndex: fanStyle.zIndex, transformOrigin: 'bottom center' } : undefined}
      >
        {showFront ? (
          <img src={url} alt={id ?? 'card'} className="card-image" />
        ) : (
          <CardBack />
        )}
      </div>

      <template x-teleport="body">
        <div
          className="card-modal-overlay"
          x-show="modalOpen"
          x-cloak
          {...{
            'x-on:click':
              'if ($event.target === $event.currentTarget) modalOpen = false',
          }}
        >
          <div className="card-modal-content" {...{ 'x-on:click.stop': '' }}>
            {!modalContent && (
              <button
                className="card-modal-button"
                x-on:click="modalOpen = false"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="white"
                  />
                </svg>
                Choose this card
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="white"
                  />
                </svg>
              </button>
            )}

            {showFront ? (
              <img src={url} alt={id ?? 'card'} className="card-image" />
            ) : (
              <CardBack />
            )}

            {modalContent}
          </div>
        </div>
      </template>
    </div>
  );
}

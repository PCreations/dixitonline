/** @jsx h */
import { h } from 'preact';
import { CardBack } from './CardBack.js';

interface CardProps {
  id?: string;
  url?: string;
}

export function Card({ id, url }: CardProps) {
  const showFront = !!url;

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

      <div className="card" x-on:click="modalOpen = ! modalOpen">
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

            {showFront ? (
              <img src={url} alt={id ?? 'card'} className="card-image" />
            ) : (
              <CardBack />
            )}
          </div>
        </div>
      </template>
    </div>
  );
}

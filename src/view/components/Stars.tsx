/** @jsx h */
import { h } from 'preact';

interface StarProps {
  size: number;
  opacity: number;
  color: string;
  top: string;
  left: string;
}

function SingleStar({
  size,
  opacity,
  color,
  top,
  left,
}: StarProps & { index: number }) {
  return (
    <div
      className="star"
      style={{
        position: 'absolute',
        top,
        left,
        opacity,
        transform: `scale(${size})`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      }}
    >
      <svg
        width="15"
        height="14"
        viewBox="0 0 15 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.67114 0.0180511L8.36615 6.24304L14.5912 6.93805L8.36615 7.63304L7.67114 13.857L6.97617 7.63304L0.75116 6.93805L6.97617 6.24304L7.67114 0.0180511Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

export function Stars() {
  // Generate many stars programmatically with gradient distribution
  const colors = ['#B2206E', '#8B1F6B', '#D94A8C', '#6B1854', '#C93A7D'];
  const stars = [];

  // Generate 200 stars with weighted distribution (more at top, less at bottom)
  for (let i = 0; i < 200; i++) {
    const colorIndex = Math.floor(Math.random() * colors.length);

    // Weighted random position - bias towards top
    // Using quadratic distribution: most stars in top 50%, fewer below
    const randomValue = Math.random();
    const verticalPosition = randomValue * randomValue * 100; // Squares the random value to bias towards 0

    stars.push({
      size: 0.3 + Math.random() * 1.0, // Random size between 0.3 and 1.3
      opacity: 0.2 + Math.random() * 0.7, // Random opacity between 0.2 and 0.9
      color: colors[colorIndex],
      top: `${verticalPosition}%`, // Weighted vertical position (more at top)
      left: `${Math.random() * 100}%`, // Random horizontal position
    });
  }

  return (
    <div className="stars-container">
      {stars.map((star, index) => (
        <SingleStar key={index} {...star} index={index} />
      ))}
    </div>
  );
}

/** @jsx h */
import { h } from 'preact';

interface StarProps {
  size: number;
  opacity: number;
  color: string;
  top: string;
  left: string;
}

function SingleStar({ size, opacity, color, top, left }: StarProps & { index: number }) {
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
      <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.67114 0.0180511L8.36615 6.24304L14.5912 6.93805L8.36615 7.63304L7.67114 13.857L6.97617 7.63304L0.75116 6.93805L6.97617 6.24304L7.67114 0.0180511Z" fill={color}/>
      </svg>
    </div>
  );
}

export function Stars() {
  // Create an array of star configurations with variations
  const stars = [
    // Bright pink stars
    { size: 1.2, opacity: 0.9, color: '#B2206E', top: '10%', left: '15%' },
    { size: 0.8, opacity: 0.7, color: '#B2206E', top: '20%', left: '80%' },
    { size: 1.0, opacity: 0.8, color: '#B2206E', top: '35%', left: '25%' },
    
    // Purple stars
    { size: 0.7, opacity: 0.6, color: '#8B1F6B', top: '15%', left: '45%' },
    { size: 1.1, opacity: 0.8, color: '#8B1F6B', top: '40%', left: '70%' },
    { size: 0.9, opacity: 0.7, color: '#8B1F6B', top: '25%', left: '60%' },
    
    // Light pink stars (dimmer)
    { size: 0.6, opacity: 0.5, color: '#D94A8C', top: '8%', left: '65%' },
    { size: 0.8, opacity: 0.4, color: '#D94A8C', top: '30%', left: '10%' },
    { size: 0.7, opacity: 0.5, color: '#D94A8C', top: '18%', left: '35%' },
    { size: 0.5, opacity: 0.4, color: '#D94A8C', top: '45%', left: '85%' },
    
    // Deep purple stars
    { size: 0.9, opacity: 0.6, color: '#6B1854', top: '22%', left: '90%' },
    { size: 0.6, opacity: 0.5, color: '#6B1854', top: '38%', left: '50%' },
    { size: 1.0, opacity: 0.7, color: '#6B1854', top: '12%', left: '5%' },
    
    // More scattered stars
    { size: 0.4, opacity: 0.3, color: '#B2206E', top: '5%', left: '30%' },
    { size: 0.5, opacity: 0.4, color: '#D94A8C', top: '42%', left: '40%' },
    { size: 0.8, opacity: 0.6, color: '#8B1F6B', top: '28%', left: '75%' },
    { size: 0.6, opacity: 0.5, color: '#B2206E', top: '33%', left: '55%' },
    { size: 0.7, opacity: 0.4, color: '#6B1854', top: '48%', left: '20%' },
    { size: 0.9, opacity: 0.7, color: '#B2206E', top: '50%', left: '65%' },
    { size: 0.5, opacity: 0.3, color: '#D94A8C', top: '7%', left: '85%' },
  ];

  return (
    <div className="stars-container">
      {stars.map((star, index) => (
        <SingleStar key={index} {...star} index={index} />
      ))}
    </div>
  );
}
/** @jsx h */
import { h } from 'preact';

export function Menu() {
  return (
    <nav className="menu-container">
      <div className="menu-logo">
        <span className="menu-logo-text">TIXID</span>
      </div>

      <div className="menu-items">
        <a href="/" className="menu-link">
          <span>Home</span>
        </a>

        <a href="/profile" className="menu-profile-button">
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12.5"
              cy="12.5"
              r="11.5"
              stroke="white"
              stroke-width="2"
            />
            <circle cx="12.5" cy="10" r="4" fill="white" />
            <path
              d="M5 20C5 16.134 8.134 13 12 13H13C16.866 13 20 16.134 20 20"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </a>
      </div>
    </nav>
  );
}

/** @jsx h */
import { h } from 'preact';
import { Logo } from './Logo.js';
import { Menu } from './Menu.js';
import { Stars } from './Stars.js';

interface LobbyProps {
  players?: Array<string>;
  maxPlayers?: number;
}

export function Lobby({ players = ['Jeck_Ship', 'Player_2', 'SuperGamer12'], maxPlayers = 8 }: LobbyProps) {
  return (
    <div className="lobby-container">
      <Menu />
      <Stars />

      <div className="lobby-content">
        <Logo variant="lobby" />

        <p className="lobby-status">Waiting for players...</p>

        <div className="lobby-box">
          <div className="lobby-header">
            <div className="lobby-counter">{players.length}/{maxPlayers}</div>
          </div>

          <div className="lobby-players">
            {players.map((playerName, index) => (
              <div key={index} className="lobby-player">
                <svg className="lobby-player-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
                </svg>
                <span className="lobby-player-name">{playerName}</span>
              </div>
            ))}
          </div>

          <div className="lobby-actions">
            <button className="lobby-button lobby-button-secondary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 10.5V13.5C13 14.33 12.33 15 11.5 15H2.5C1.67 15 1 14.33 1 13.5V4.5C1 3.67 1.67 3 2.5 3H5.5M10 1H15M15 1V6M15 1L7 9" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Invite your friends
            </button>

            <button className="lobby-button lobby-button-primary">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                <path d="M0 0V14L12 7L0 0Z" fill="white"/>
              </svg>
              Start the game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** @jsx h */
import { h } from 'preact';
import { AuthProvider } from './AuthProvider.js';
import { Button } from './Button.js';
import { Dune } from './Dune.js';
import { Logo } from './Logo.js';
import { Menu } from './Menu.js';
import { Moon } from './Moon.js';
import { SandSteps } from './SandSteps.js';
import { Stars } from './Stars.js';

export function CreateGame() {
  return (
    <AuthProvider>
      <div className="home-container">
        <Menu />
        <Stars />
        <div className="moon-container">
          <Moon />
        </div>
        <Logo />
        <p className="journey-subtitle">Nouvelle partie</p>

        <div className="create-game-form">
          <form action="/game/create" method="POST">
            <fieldset className="create-game-fieldset">
              <legend className="create-game-legend">
                Condition de fin de partie
              </legend>

              <label className="create-game-option">
                <input
                  type="radio"
                  name="endConditionType"
                  value="NumberOfTimesBeingStoryteller"
                  checked
                />
                <span className="create-game-option-text">
                  Nombre de tours en tant que conteur
                </span>
                <input
                  type="number"
                  name="numberOfTimes"
                  value="3"
                  min="1"
                  max="10"
                  className="create-game-number"
                />
              </label>

              <label className="create-game-option">
                <input
                  type="radio"
                  name="endConditionType"
                  value="LimitOfPoints"
                />
                <span className="create-game-option-text">Score limite</span>
                <input
                  type="number"
                  name="limitOfPoints"
                  value="30"
                  min="10"
                  max="100"
                  step="5"
                  className="create-game-number"
                />
              </label>
            </fieldset>

            <div className="create-game-submit">
              <Button type="submit">Créer la partie</Button>
            </div>
          </form>
        </div>

        <div className="dune-wrapper">
          <div className="dune-container">
            <Dune />
            <div className="sand-steps-container">
              <SandSteps />
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

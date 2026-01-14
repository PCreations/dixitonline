/** @jsx h */
import type { ComponentChildren } from 'preact';
import { h } from 'preact';
import { LoginForm } from './LoginForm.js';

interface AuthProviderProps {
  children: ComponentChildren;
}

// Helper to create Alpine.js attributes with special characters
const alpine = {
  onSubmitPrevent: (handler: string) => ({ 'x-on:submit.prevent': handler }),
  onClick: (handler: string) => ({ 'x-on:click': handler }),
  bindDisabled: (expr: string) => ({ 'x-bind:disabled': expr }),
};

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <div x-data="authStore()" x-init="init()">
      {/* Loading state */}
      <div
        x-show="loading"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div class="text-white text-xl">Chargement...</div>
      </div>

      {/* Login modal for new users */}
      <div
        x-show="showLoginModal && !loading"
        x-cloak
        class="auth-modal-overlay"
      >
        <div class="auth-modal">
          <h2 class="auth-modal-title">Bienvenue sur Tixid !</h2>
          <LoginForm variant="modal" />
        </div>
      </div>

      {/* Upgrade modal for anonymous users who want to save their account */}
      <div
        x-show="showUpgradeModal && !loading"
        x-cloak
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              Sauvegarder mon compte
            </h2>
            <button
              type="button"
              {...alpine.onClick('showUpgradeModal = false')}
              class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
          <p class="text-gray-600 mb-4">
            Créez un compte pour retrouver votre progression sur n'importe quel
            appareil.
          </p>

          <form {...alpine.onSubmitPrevent('upgradeWithEmail()')} class="mb-4">
            <input
              type="email"
              x-model="email"
              placeholder="Email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              x-model="password"
              placeholder="Mot de passe"
              required
              minLength={6}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div
              x-show="error"
              class="text-red-500 text-sm mb-3"
              x-text="error"
            ></div>
            <button
              type="submit"
              {...alpine.bindDisabled('loading')}
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Créer mon compte
            </button>
          </form>

          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <div class="space-y-2">
            <button
              type="button"
              {...alpine.onClick('upgradeWithGoogle()')}
              class="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              Continuer avec Google
            </button>
            <button
              type="button"
              {...alpine.onClick('upgradeWithDiscord()')}
              class="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
            >
              Continuer avec Discord
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {children}
    </div>
  );
}

/**
 * User menu component to show current user info and upgrade/logout options.
 * Use this in your header/navbar. Must be inside an AuthProvider.
 */
export function UserMenu() {
  return (
    <div class="relative">
      <div x-show="user" class="flex items-center gap-2">
        <span class="text-sm" x-text="username || 'Joueur'"></span>
        <button
          type="button"
          x-show="user?.is_anonymous"
          {...alpine.onClick('showUpgradeModal = true')}
          class="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
        >
          Sauvegarder
        </button>
        <button
          type="button"
          x-show="user && !user.is_anonymous"
          {...alpine.onClick('signOut()')}
          class="text-xs text-gray-500 hover:text-gray-700"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

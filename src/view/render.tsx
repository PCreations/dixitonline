import { VNode } from "preact";
import { render } from "preact-render-to-string";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderToString(vnode: VNode<any>): string {
  return render(vnode);
}

const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";

const authStoreScript = `
// Helper to manage auth cookie for SSR
function setAuthCookie(token) {
  if (token) {
    document.cookie = 'sb-access-token=' + token + '; path=/; max-age=604800; SameSite=Lax';
  } else {
    document.cookie = 'sb-access-token=; path=/; max-age=0';
  }
}

document.addEventListener('alpine:init', () => {
  // Auth store - manages session state and upgrade modal
  Alpine.data('authStore', () => ({
    user: null,
    username: '',
    email: '',
    password: '',
    showLoginModal: false,
    showUpgradeModal: false,
    loading: true,
    error: null,

    async init() {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        const serverSawAuth = document.body.dataset.serverAuth === 'true';

        if (session) {
          // Sync cookie with current session
          setAuthCookie(session.access_token);

          // If server didn't see us as authenticated but we have valid session,
          // the token was refreshed - reload once to sync SSR state
          if (!serverSawAuth && !sessionStorage.getItem('auth-synced')) {
            sessionStorage.setItem('auth-synced', 'true');
            window.location.reload();
            return;
          }

          this.user = session.user;
          this.username = session.user.user_metadata?.username || '';
        } else {
          this.showLoginModal = true;
          setAuthCookie(null);
        }

        // Clear the sync flag on successful init
        sessionStorage.removeItem('auth-synced');
      } catch (e) {
        console.error('Auth init error:', e);
        this.error = e.message;
      } finally {
        this.loading = false;
      }

      // Keep cookie in sync with auth state
      window.supabase.auth.onAuthStateChange((event, session) => {
        this.user = session?.user ?? null;
        if (session?.user) {
          this.username = session.user.user_metadata?.username || '';
          setAuthCookie(session.access_token);
        } else {
          setAuthCookie(null);
        }
      });
    },

    async upgradeWithEmail() {
      this.loading = true;
      this.error = null;
      try {
        // Use updateUser to link email to anonymous account
        const { error } = await window.supabase.auth.updateUser({
          email: this.email
        });
        if (error) throw error;
        alert('Un email de confirmation a été envoyé à ' + this.email);
        this.showUpgradeModal = false;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async upgradeWithGoogle() {
      await window.supabase.auth.linkIdentity({ provider: 'google' });
    },

    async upgradeWithDiscord() {
      await window.supabase.auth.linkIdentity({ provider: 'discord' });
    },

    async signOut() {
      sessionStorage.removeItem('auth-synced');
      setAuthCookie(null);
      await window.supabase.auth.signOut();
      window.location.reload();
    }
  }));

  // Login form with 2 sections: guest (anonymous) and email (magic link)
  Alpine.data('loginForm', () => ({
    guestUsername: '',
    guestUsernameError: null,
    email: '',
    emailError: null,
    loading: false,
    error: null,
    successMessage: null,

    async playAsGuest() {
      if (!this.guestUsername.trim()) {
        this.guestUsernameError = 'Veuillez entrer un pseudo';
        return;
      }
      this.guestUsernameError = null;
      this.loading = true;
      this.error = null;

      try {
        console.log('[DEBUG] Supabase URL:', window.supabase.supabaseUrl);
        console.log('[DEBUG] Starting playAsGuest for:', this.guestUsername.trim());

        // Check username availability
        const check = await fetch('/api/auth/check-username?username=' + encodeURIComponent(this.guestUsername.trim()));
        const { available } = await check.json();
        console.log('[DEBUG] Username available:', available);
        if (!available) throw new Error('Ce pseudo est déjà pris');

        console.log('[DEBUG] Calling signInAnonymously...');
        const { data, error } = await window.supabase.auth.signInAnonymously({
          options: { data: { username: this.guestUsername.trim() } }
        });
        console.log('[DEBUG] signInAnonymously result - data:', JSON.stringify(data, null, 2));
        console.log('[DEBUG] signInAnonymously result - error:', JSON.stringify(error, null, 2));
        if (error) throw error;

        setAuthCookie(data.session?.access_token);
        window.location.href = '/';
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async sendMagicLink() {
      if (!this.email.trim()) {
        this.emailError = 'Veuillez entrer un email';
        return;
      }
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(this.email.trim())) {
        this.emailError = 'Email invalide';
        return;
      }
      this.emailError = null;
      this.loading = true;
      this.error = null;

      try {
        const { error } = await window.supabase.auth.signInWithOtp({
          email: this.email.trim(),
          options: { emailRedirectTo: window.location.origin + '/auth/callback' }
        });
        if (error) throw error;

        this.successMessage = 'Un lien magique a été envoyé à ' + this.email;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }));

  // Auth callback - handles magic link redirect
  Alpine.data('authCallback', () => ({
    loading: true,
    needsUsername: false,
    username: '',
    usernameError: null,
    error: null,

    async init() {
      // Wait for Supabase to process the magic link tokens from URL hash
      // The tokens are in the URL fragment (#access_token=...&refresh_token=...)
      // Supabase client extracts them automatically, but we need to wait for it
      const { data: { subscription } } = window.supabase.auth.onAuthStateChange(async (event, session) => {
        // Unsubscribe immediately - we only need the first event
        subscription.unsubscribe();

        if (!session) {
          this.error = 'Session invalide ou lien expiré';
          this.loading = false;
          return;
        }

        setAuthCookie(session.access_token);

        // Check if user has a username
        const hasUsername = session.user.user_metadata?.username;
        if (!hasUsername) {
          this.needsUsername = true;
          this.loading = false;
          return;
        }

        // All good, redirect to home
        window.location.href = '/';
      });

      // Timeout after 10 seconds if no auth event received
      setTimeout(() => {
        if (this.loading && !this.needsUsername) {
          subscription.unsubscribe();
          this.error = 'Délai d\\'attente dépassé. Veuillez réessayer.';
          this.loading = false;
        }
      }, 10000);
    },

    async setUsername() {
      if (!this.username.trim()) {
        this.usernameError = 'Veuillez entrer un pseudo';
        return;
      }
      this.usernameError = null;
      this.loading = true;

      try {
        // Check availability
        const check = await fetch('/api/auth/check-username?username=' + encodeURIComponent(this.username.trim()));
        const { available } = await check.json();
        if (!available) throw new Error('Ce pseudo est déjà pris');

        // Update user_metadata in Supabase
        const { error } = await window.supabase.auth.updateUser({
          data: { username: this.username.trim() }
        });
        if (error) throw error;

        // Refresh session to get new JWT with updated metadata
        const { data: { session } } = await window.supabase.auth.refreshSession();
        if (session) {
          setAuthCookie(session.access_token);
        }

        window.location.href = '/';
      } catch (e) {
        this.error = e.message;
        this.loading = false;
      }
    }
  }));
});

// Inject JWT into all HTMX requests (wait for DOM to be ready)
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('htmx:configRequest', async (e) => {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session?.access_token) {
      e.detail.headers['Authorization'] = 'Bearer ' + session.access_token;
    }
  });
});
`;

export interface RenderHtmlPageOptions {
  readonly isAuthenticated?: boolean;
}

export function renderHtmlPage(title: string, body: string, options?: RenderHtmlPageOptions): string {
  const serverAuth = options?.isAuthenticated ? 'true' : 'false';
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/assets/styles/main.build.css">
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script src="https://unpkg.com/htmx-ext-sse@2.2.2/sse.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
      console.log('[DEBUG] Creating Supabase client with URL:', '${supabaseUrl}');
      console.log('[DEBUG] Using publishable key:', '${supabasePublishableKey}'.substring(0, 50) + '...');
      window.supabase = window.supabase.createClient('${supabaseUrl}', '${supabasePublishableKey}');
    </script>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>${authStoreScript}</script>
</head>
<body data-server-auth="${serverAuth}">
    ${body}
</body>
</html>`;
}

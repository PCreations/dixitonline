import { VNode } from "preact";
import { render } from "preact-render-to-string";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderToString(vnode: VNode<any>): string {
  return render(vnode);
}

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

const authStoreScript = `
// Helper to manage auth cookie for SSR
function setAuthCookie(token) {
  if (token) {
    document.cookie = 'sb-access-token=' + token + '; path=/; max-age=3600; SameSite=Lax';
  } else {
    document.cookie = 'sb-access-token=; path=/; max-age=0';
  }
}

document.addEventListener('alpine:init', () => {
  Alpine.data('authStore', () => ({
    user: null,
    username: '',
    email: '',
    password: '',
    showUsernameModal: false,
    showUpgradeModal: false,
    loading: true,
    error: null,

    async init() {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
          this.user = session.user;
          this.username = session.user.user_metadata?.username || '';
          // Sync cookie with current session
          setAuthCookie(session.access_token);
        } else {
          this.showUsernameModal = true;
          setAuthCookie(null);
        }
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

    async createAnonymousUser() {
      this.loading = true;
      this.error = null;
      try {
        // Pass username directly to signInAnonymously for immediate metadata
        const { data, error } = await window.supabase.auth.signInAnonymously({
          options: {
            data: { username: this.username }
          }
        });
        if (error) throw error;

        // Set cookie with the access token (already contains username)
        setAuthCookie(data.session?.access_token);

        // Refresh the page to get server-rendered content with auth state
        window.location.reload();
      } catch (e) {
        this.error = e.message;
        this.loading = false;
      }
    },

    async upgradeWithEmail() {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await window.supabase.auth.updateUser({
          email: this.email,
          password: this.password
        });
        if (error) throw error;
        alert('Vérifiez votre email pour confirmer');
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
      setAuthCookie(null);
      await window.supabase.auth.signOut();
      // Refresh the page to get server-rendered content without auth
      window.location.reload();
    }
  }));

  // Login form for /login page
  Alpine.data('loginForm', () => ({
    username: '',
    email: '',
    loading: false,
    error: null,
    submitted: false,
    emailError: null,

    validateEmail() {
      if (!this.email) {
        this.emailError = null;
        return true;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.emailError = 'Email invalide';
        return false;
      }
      this.emailError = null;
      return true;
    },

    validate() {
      this.submitted = true;
      let valid = true;

      if (!this.username.trim()) {
        valid = false;
      }

      if (!this.validateEmail()) {
        valid = false;
      }

      return valid;
    },

    async submit() {
      if (!this.validate()) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        if (this.email) {
          // Magic link flow
          const { error } = await window.supabase.auth.signInWithOtp({
            email: this.email,
            options: {
              data: { username: this.username.trim() },
              emailRedirectTo: window.location.origin + this.getRedirectUrl()
            }
          });
          if (error) throw error;
          alert('Un lien magique a été envoyé à votre email !');
        } else {
          // Anonymous flow
          const { data, error } = await window.supabase.auth.signInAnonymously({
            options: {
              data: { username: this.username.trim() }
            }
          });
          if (error) throw error;
          setAuthCookie(data.session?.access_token);
          window.location.href = this.getRedirectUrl();
        }
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    getRedirectUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.get('redirect') || '/';
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

export function renderHtmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/assets/styles/main.build.css">
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
      window.supabase = window.supabase.createClient('${supabaseUrl}', '${supabasePublishableKey}');
    </script>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>${authStoreScript}</script>
</head>
<body>
    ${body}
</body>
</html>`;
}

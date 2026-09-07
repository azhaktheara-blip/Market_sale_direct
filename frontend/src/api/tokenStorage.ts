/**
 * In-Memory Access Token & Session Storage Security Manager
 *
 * Security Rationale:
 * 1. Access Tokens (short-lived 15m) are held strictly in JS heap memory.
 *    They are NEVER written to localStorage, defending against persistent XSS
 *    and credential exfiltration.
 * 2. Refresh Tokens & session user cache are stored in sessionStorage (per-tab,
 *    cleared on browser/tab close), never in long-lived localStorage.
 * 3. Any legacy credentials in localStorage from older builds are proactively
 *    purged upon initialization and logout.
 */

let inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  clearAccessToken(): void {
    inMemoryAccessToken = null;
  },

  getRefreshToken(): string | null {
    try {
      return sessionStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string | null): void {
    try {
      if (token) {
        sessionStorage.setItem('refresh_token', token);
      } else {
        sessionStorage.removeItem('refresh_token');
      }
    } catch {
      // Ignore sessionStorage exceptions
    }
  },

  getUser<T>(): T | null {
    try {
      const saved = sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  setUser<T>(user: T | null): void {
    try {
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('user');
      }
    } catch {
      // Ignore
    }
  },

  clearAll(): void {
    inMemoryAccessToken = null;
    try {
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user');

      // Purge legacy persistent localStorage entries
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } catch {
      // Ignore
    }
  },

  purgeLegacyLocalStorage(): void {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } catch {
      // Ignore
    }
  },
};

// Immediately purge legacy localStorage on script load
tokenStorage.purgeLegacyLocalStorage();

// Storage can be unavailable in privacy modes. The current tab remains usable.
const fallback = new Map<string, string>();
export const safeStorage = {
  get(key: string, session = false): string | null {
    try { return (session ? window.sessionStorage : window.localStorage).getItem(key) ?? fallback.get(key) ?? null; }
    catch { return fallback.get(key) ?? null; }
  },
  set(key: string, value: string, session = false): void {
    fallback.set(key, value);
    try { (session ? window.sessionStorage : window.localStorage).setItem(key, value); } catch { /* tab fallback */ }
  },
  remove(key: string, session = false): void {
    fallback.delete(key);
    try { (session ? window.sessionStorage : window.localStorage).removeItem(key); } catch { /* tab fallback */ }
  },
};
import type { Session } from '../types';

const STORAGE_KEY = 'garageflow.session.v2';

export function readSession(): Session | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user?.id) throw new Error('Invalid session');
    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeSession(session: Session | null): void {
  if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('garageflow:session', { detail: session }));
}

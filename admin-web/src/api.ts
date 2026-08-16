import type { Session } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const STORAGE_KEY = 'garageflow.session';

export function getSession(): Session | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function storeSession(session: Session | null) {
  if (!session) sessionStorage.removeItem(STORAGE_KEY);
  else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function login(email: string, password: string): Promise<Session> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await readResponse<Session>(response);
  storeSession(data);
  return data;
}

export async function logout() {
  const session = getSession();
  try {
    if (session?.refreshToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    }
  } finally {
    storeSession(null);
  }
}

async function refreshSession(): Promise<Session | null> {
  const current = getSession();
  if (!current?.refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  });
  if (!response.ok) {
    storeSession(null);
    return null;
  }
  const next = await readResponse<Session>(response);
  storeSession(next);
  return next;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const session = getSession();
  const headers = new Headers(init.headers);
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (!(init.body instanceof FormData) && init.body !== undefined) headers.set('Content-Type', 'application/json');

  let response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && (await refreshSession())) {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: new Headers({ ...Object.fromEntries(headers), Authorization: `Bearer ${getSession()!.accessToken}` }),
    });
  }
  return readResponse<T>(response);
}

async function readResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message: string | string[] }).message)
      : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000/workshop';

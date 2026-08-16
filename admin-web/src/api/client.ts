import { readSession, writeSession } from '../auth/session';
import { config } from '../config';
import type { Session } from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<Session | null> | null = null;

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') || '';
  const payload: unknown = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    let message = `Solicitud fallida (${response.status})`;
    if (typeof payload === 'string' && payload.trim()) message = payload;
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const raw = (payload as { message?: string | string[] }).message;
      if (Array.isArray(raw)) message = raw.join(' · ');
      else if (raw) message = raw;
    }
    throw new ApiError(message, response.status, payload);
  }
  return payload as T;
}

async function performFetch(path: string, init: RequestInit, accessToken?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${config.apiUrl}${path}`, { ...init, headers });
}

async function refreshSession(): Promise<Session | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const current = readSession();
    if (!current?.refreshToken) return null;
    try {
      const response = await fetch(`${config.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (!response.ok) {
        writeSession(null);
        return null;
      }
      const next = await parseResponse<Session>(response);
      writeSession(next);
      return next;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const current = readSession();
  let response: Response;
  try {
    response = await performFetch(path, init, current?.accessToken);
  } catch {
    throw new ApiError('No fue posible conectar con GarageFlow API. Verifica que el backend esté activo y que CORS permita este origen.', 0);
  }

  if (response.status === 401 && retry && current?.refreshToken) {
    const next = await refreshSession();
    if (next) {
      response = await performFetch(path, init, next.accessToken);
    }
  }

  if (response.status === 401) writeSession(null);
  return parseResponse<T>(response);
}

export async function login(email: string, password: string): Promise<Session> {
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw new ApiError('No se pudo conectar con el backend. Si usas Render Free, el servicio puede estar despertando.', 0);
  }
  const session = await parseResponse<Session>(response);
  writeSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const current = readSession();
  try {
    if (current?.refreshToken) {
      await fetch(`${config.apiUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
    }
  } finally {
    writeSession(null);
  }
}

export async function apiBlob(path: string, retry = true): Promise<Blob> {
  const current = readSession();
  let response: Response;
  try {
    response = await performFetch(path, {}, current?.accessToken);
  } catch {
    throw new ApiError('No fue posible descargar el archivo desde GarageFlow API.', 0);
  }
  if (response.status === 401 && retry && current?.refreshToken) {
    const next = await refreshSession();
    if (next) response = await performFetch(path, {}, next.accessToken);
  }
  if (!response.ok) {
    await parseResponse<unknown>(response);
  }
  return response.blob();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/health`, { signal: AbortSignal.timeout(8000) });
    return response.ok;
  } catch {
    return false;
  }
}

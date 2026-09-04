import type {ApiErrorBody} from '../types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

/** Prefer same-origin /__vera_api on any HTTPS page (avoids mixed content). */
function resolveApiBase(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `${window.location.origin}/__vera_api`;
  }
  return fromEnv || 'http://127.0.0.1:3000';
}

export const API_BASE_URL = resolveApiBase();

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let unauthorizedNotified = false;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    unauthorizedNotified = false;
  }
}

/** REL-11: register a handler for soft 401 (clear token/session → login). */
export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(
      body.error?.code ?? 'http_error',
      body.error?.message ?? response.statusText,
      response.status,
    );
  } catch {
    return new ApiError('http_error', response.statusText || 'Request failed', response.status);
  }
}

export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {Accept: 'application/json'};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('network', 'Brak połączenia z API', 0);
  }
  if (!response.ok) {
    const err = await parseError(response);
    if (
      response.status === 401 &&
      authToken &&
      path !== '/admin/auth/login' &&
      (err.code === 'unauthorized' || err.code === 'session_revoked')
    ) {
      if (!unauthorizedNotified) {
        unauthorizedNotified = true;
        try {
          onUnauthorized?.();
        } catch {
          // ignore handler errors — request still fails below
        }
      }
    }
    throw err;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'invalid_credentials':
        return 'Nieprawidłowy login lub hasło.';
      case 'invalid_token':
        return 'Link jest nieprawidłowy albo wygasł.';
      case 'email_taken':
        return 'Ten e-mail jest już zajęty.';
      case 'username_taken':
        return 'Ten login jest już zajęty.';
      case 'already_claimed':
        return 'To konto jest już aktywowane.';
      case 'email_only':
        return 'Tego administratora można zmienić tylko przez e-mail.';
      case 'cannot_delete_self':
        return 'Nie możesz usunąć własnego konta.';
      case 'last_admin':
        return 'Nie można usunąć ostatniego administratora.';
      case 'setup_required':
        return 'Najpierw dokończ aktywację konta e-mailem.';
      case 'forbidden':
        return 'Brak uprawnień do tej operacji.';
      case 'rate_limited':
        return 'Zbyt wiele prób. Spróbuj za chwilę.';
      case 'network':
        return 'Brak połączenia z API.';
      default:
        return err.message;
    }
  }
  return err instanceof Error ? err.message : 'Coś poszło nie tak.';
}

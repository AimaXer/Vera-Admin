import {fetchAdminMe} from './api/admin';
import {setAuthToken} from './api/http';
import type {AdminPublic} from './types';

const STORAGE_KEY = 'vera-admin-token';

/**
 * Operator sessions are tab-scoped: closing the browser ends the session and
 * leaves no admin token on disk of a shared workstation.
 */
function store(): Storage {
  return sessionStorage;
}

export type Session = {
  token: string;
  admin: AdminPublic;
  mustClaimEmail: boolean;
};

export function readStoredToken(): string | null {
  try {
    return store().getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistToken(token: string | null): void {
  try {
    if (token) {
      store().setItem(STORAGE_KEY, token);
    } else {
      store().removeItem(STORAGE_KEY);
    }
    // Older builds stored the operator token in localStorage.
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage disabled by policy — session stays in memory only
  }
  setAuthToken(token);
}

export async function restoreSession(): Promise<Session | null> {
  const token = readStoredToken();
  if (!token) {
    setAuthToken(null);
    return null;
  }
  setAuthToken(token);
  try {
    const body = await fetchAdminMe();
    return {token, admin: body.admin, mustClaimEmail: body.mustClaimEmail};
  } catch {
    persistToken(null);
    return null;
  }
}

export function navigate(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function queryParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

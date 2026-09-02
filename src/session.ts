import {fetchAdminMe} from './api/admin';
import {setAuthToken} from './api/http';
import type {AdminPublic} from './types';

const STORAGE_KEY = 'vera-admin-token';

export type Session = {
  token: string;
  admin: AdminPublic;
  mustClaimEmail: boolean;
};

export function readStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function persistToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
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

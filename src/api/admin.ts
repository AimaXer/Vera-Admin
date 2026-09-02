import {apiRequest} from './http';
import type {
  AdminLoginResponse,
  AdminPublic,
  AdminSessionResponse,
  AdminUserRecord,
  TelemetryCrashesResponse,
  TelemetryEventsResponse,
  TelemetryStats,
  UserTelemetrySummary,
} from '../types';

export function adminLogin(login: string, password: string): Promise<AdminLoginResponse> {
  return apiRequest('POST', '/admin/auth/login', {login, password});
}

export function fetchAdminMe(): Promise<AdminSessionResponse> {
  return apiRequest('GET', '/admin/auth/me');
}

export function claimAdminEmail(email: string): Promise<{ok: boolean; email: string}> {
  return apiRequest('POST', '/admin/auth/claim-email', {email});
}

export function completeAdminSetup(
  token: string,
  password: string,
): Promise<{ok: boolean; email: string}> {
  return apiRequest('POST', '/admin/auth/complete-setup', {token, password});
}

export function forgotAdminPassword(email: string): Promise<{ok: boolean}> {
  return apiRequest('POST', '/admin/auth/forgot-password', {email});
}

export function resetAdminPassword(token: string, password: string): Promise<{ok: boolean}> {
  return apiRequest('POST', '/admin/auth/reset-password', {token, password});
}

export function requestAdminEmailChange(email: string): Promise<{ok: boolean; email: string}> {
  return apiRequest('POST', '/admin/auth/change-email', {email});
}

export function confirmAdminEmail(token: string): Promise<{ok: boolean; email: string}> {
  return apiRequest('POST', '/admin/auth/confirm-email', {token});
}

export function listAdmins(): Promise<AdminPublic[]> {
  return apiRequest('GET', '/admin/admins');
}

export function createAdmin(body: {
  email: string;
  displayName?: string;
  password?: string;
}): Promise<AdminPublic> {
  return apiRequest('POST', '/admin/admins', body);
}

export function updateAdmin(
  id: string,
  body: {email?: string; displayName?: string; password?: string},
): Promise<AdminPublic> {
  return apiRequest('PUT', `/admin/admins/${encodeURIComponent(id)}`, body);
}

export function sendAdminResetEmail(id: string): Promise<{ok: boolean}> {
  return apiRequest('POST', `/admin/admins/${encodeURIComponent(id)}/reset-email`);
}

export function deleteAdmin(id: string): Promise<{ok: boolean}> {
  return apiRequest('DELETE', `/admin/admins/${encodeURIComponent(id)}`);
}

export function listOrgUsers(): Promise<AdminUserRecord[]> {
  return apiRequest('GET', '/admin/users');
}

export function createOrgUser(body: {
  username: string;
  password: string;
  displayName: string;
  email?: string | null;
}): Promise<AdminUserRecord> {
  return apiRequest('POST', '/admin/users', body);
}

export function updateOrgUser(
  id: string,
  body: {
    username?: string;
    password?: string;
    displayName?: string;
    email?: string | null;
  },
): Promise<AdminUserRecord> {
  return apiRequest('PUT', `/admin/users/${encodeURIComponent(id)}`, body);
}

export function deleteOrgUser(id: string): Promise<{ok: boolean}> {
  return apiRequest('DELETE', `/admin/users/${encodeURIComponent(id)}`);
}

export type TelemetryQuery = {
  from?: string;
  to?: string;
  level?: string;
  source?: string;
  userId?: string;
  q?: string;
  cursor?: string;
  limit?: number;
};

export function fetchTelemetryStats(from?: string, to?: string): Promise<TelemetryStats> {
  const params = new URLSearchParams();
  if (from) {
    params.set('from', from);
  }
  if (to) {
    params.set('to', to);
  }
  const qs = params.toString();
  return apiRequest('GET', `/admin/telemetry/stats${qs ? `?${qs}` : ''}`);
}

export function fetchTelemetryEvents(query: TelemetryQuery = {}): Promise<TelemetryEventsResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return apiRequest('GET', `/admin/telemetry/events${qs ? `?${qs}` : ''}`);
}

export function fetchTelemetryCrashes(query: TelemetryQuery = {}): Promise<TelemetryCrashesResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return apiRequest('GET', `/admin/telemetry/crashes${qs ? `?${qs}` : ''}`);
}

export function fetchUserTelemetrySummary(userId: string): Promise<UserTelemetrySummary> {
  return apiRequest('GET', `/admin/telemetry/users/${encodeURIComponent(userId)}/summary`);
}

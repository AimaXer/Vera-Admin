import {apiRequest} from './http';
import type {
  AdminAuditEntry,
  AdminAuditResponse,
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
    identityBackup?: {ciphertext: string; nonce: string};
    destroyEncryption?: boolean;
  },
): Promise<AdminUserRecord> {
  return apiRequest('PUT', `/admin/users/${encodeURIComponent(id)}`, body);
}

export function deleteOrgUser(id: string): Promise<{ok: boolean}> {
  return apiRequest('DELETE', `/admin/users/${encodeURIComponent(id)}`);
}

export function forceLogoutOrgUser(id: string): Promise<{
  ok: boolean;
  tokenVersion?: number;
  socketsClosed?: number;
}> {
  return apiRequest('POST', `/admin/users/${encodeURIComponent(id)}/logout`);
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

export function fetchAdminAudit(query: {
  cursor?: string;
  limit?: number;
} = {}): Promise<AdminAuditResponse> {
  const params = new URLSearchParams();
  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  const qs = params.toString();
  return apiRequest<
    | AdminAuditResponse
    | {
        items?: Array<Record<string, unknown>>;
        entries?: Array<Record<string, unknown>>;
        nextCursor?: string | null;
      }
  >('GET', `/admin/audit${qs ? `?${qs}` : ''}`).then(raw => {
    const rows = ('entries' in raw && raw.entries ? raw.entries : null) ??
      ('items' in raw && raw.items ? raw.items : null) ??
      [];
    const entries: AdminAuditEntry[] = rows.map(row => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id ?? ''),
        action: String(r.action ?? ''),
        actorAdminId: String(r.actorAdminId ?? r.actor_admin_id ?? ''),
        actorEmail: (r.actorEmail ?? r.actor_email ?? null) as string | null,
        targetType: String(r.targetType ?? r.target_type ?? ''),
        targetId: (r.targetId ?? r.target_id ?? null) as string | null,
        createdAt: String(r.createdAt ?? r.created_at ?? ''),
      };
    });
    return {entries, nextCursor: raw.nextCursor ?? null};
  });
}

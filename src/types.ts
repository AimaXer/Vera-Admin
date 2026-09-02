export type AdminPublic = {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  claimed: boolean;
  isBootstrap: boolean;
  createdAt: string;
};

export type AdminLoginResponse = {
  token: string;
  admin: AdminPublic;
  mustClaimEmail: boolean;
};

export type AdminSessionResponse = {
  admin: AdminPublic;
  mustClaimEmail: boolean;
};

export type UserPresence = 'online' | 'offline' | 'dnd';

export type AdminUserRecord = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  hasPublicKey: boolean;
  online: boolean;
  presence: UserPresence;
  createdAt: string;
  errors7d?: number;
  lastCrash?: string | null;
  lastPlatform?: string | null;
  lastAppVersion?: string | null;
};

export type TelemetryLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type TelemetryEventRecord = {
  id: string;
  ts: string;
  level: TelemetryLevel;
  source: string;
  scope: string;
  message: string;
  userId: string | null;
  sessionId: string | null;
  deviceId: string | null;
  appVersion: string | null;
  platform: string | null;
  reqId: string | null;
  chatId: string | null;
  callId: string | null;
  httpStatus: number | null;
  errorCode: string | null;
  stack: string | null;
  meta: Record<string, unknown> | null;
};

export type CrashReportRecord = {
  id: string;
  ts: string;
  userId: string | null;
  sessionId: string | null;
  deviceId: string | null;
  platform: string | null;
  appVersion: string | null;
  message: string;
  stack: string | null;
  breadcrumbs: string[];
};

export type TelemetryStats = {
  crashes: number;
  errors: number;
  warnings: number;
  bySource: Record<string, number>;
  byDay: Array<{day: string; level: string; source: string; count: number}>;
  topErrorCodes: Array<{errorCode: string; count: number}>;
  topScopes: Array<{scope: string; count: number}>;
  usersWithErrors: number;
};

export type TelemetryEventsResponse = {
  events: TelemetryEventRecord[];
  nextCursor: string | null;
};

export type TelemetryCrashesResponse = {
  crashes: CrashReportRecord[];
  nextCursor: string | null;
};

export type UserTelemetrySummary = {
  lastCrash: string | null;
  errors7d: number;
  lastPlatform: string | null;
  lastAppVersion: string | null;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

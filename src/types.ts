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
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

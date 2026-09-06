import {FormEvent, useEffect, useState} from 'react';
import {Activity, LogOut, Pencil, Plus, ScrollText, Trash2} from 'lucide-react';
import {
  createOrgUser,
  deleteOrgUser,
  forceLogoutOrgUser,
  listOrgUsers,
  updateOrgUser,
} from '../api/admin';
import {errorMessage} from '../api/http';
import {useLiveRefresh} from '../hooks/useLiveRefresh';
import {PASSWORD_MIN_LENGTH} from '../session';
import type {AdminUserRecord} from '../types';
import {Modal} from '../ui/Modal';

type Draft = {
  username: string;
  displayName: string;
  email: string;
  password: string;
  destroyEncryption: boolean;
};

const emptyDraft: Draft = {
  username: '',
  displayName: '',
  email: '',
  password: '',
  destroyEncryption: false,
};

type Props = {
  /** SEC-4: superadmin only. */
  canDestroyEncryption?: boolean;
  /** SEC-4: superadmin only. */
  canDeleteUser?: boolean;
  onOpenLogs?: (userId: string) => void;
  onOpenCrashes?: (userId: string) => void;
};

export function UsersView({
  canDestroyEncryption = false,
  canDeleteUser = false,
  onOpenLogs,
  onOpenCrashes,
}: Props): React.JSX.Element {
  const [rows, setRows] = useState<AdminUserRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<AdminUserRecord | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<AdminUserRecord | null>(null);
  const [pendingLogout, setPendingLogout] = useState<AdminUserRecord | null>(null);

  async function reload(opts?: {silent?: boolean}): Promise<void> {
    try {
      setRows(await listOrgUsers());
      setError(null);
    } catch (err) {
      if (!opts?.silent) {
        setError(errorMessage(err));
      }
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useLiveRefresh(() => reload({silent: true}), !busy);

  function openNew(): void {
    setDraft(emptyDraft);
    setEditing('new');
    setError(null);
  }

  function openEdit(row: AdminUserRecord): void {
    setDraft({
      username: row.username,
      displayName: row.displayName,
      email: row.email ?? '',
      password: '',
      destroyEncryption: false,
    });
    setEditing(row);
    setError(null);
  }

  async function onSave(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing === 'new') {
        await createOrgUser({
          username: draft.username,
          password: draft.password,
          displayName: draft.displayName,
          email: draft.email || null,
        });
      } else if (editing) {
        const passwordChanging = Boolean(draft.password);
        const usernameChanging = draft.username !== editing.username;
        if (
          canDestroyEncryption &&
          (passwordChanging || usernameChanging) &&
          draft.destroyEncryption
        ) {
          const ok = window.confirm(
            'To trwale usunie backup kluczy E2E. Historia wiadomości może stać się nieodszyfrowalna na wszystkich urządzeniach. Kontynuować?',
          );
          if (!ok) {
            setBusy(false);
            return;
          }
        }
        await updateOrgUser(editing.id, {
          username: draft.username,
          displayName: draft.displayName,
          email: draft.email || null,
          password: draft.password || undefined,
          destroyEncryption:
            canDestroyEncryption &&
            (passwordChanging || usernameChanging) &&
            draft.destroyEncryption
              ? true
              : undefined,
        });
      }
      setEditing(null);
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(): Promise<void> {
    if (!pendingDelete) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteOrgUser(pendingDelete.id);
      setPendingDelete(null);
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onForceLogout(): Promise<void> {
    if (!pendingLogout) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await forceLogoutOrgUser(pendingLogout.id);
      setPendingLogout(null);
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card">
        <div className="toolbar">
          <span className="hint">Konta komunikatora Very w organizacji. Lista odświeża się na żywo.</span>
          <button className="btn-primary" type="button" onClick={openNew}>
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
              <Plus size={16} /> Dodaj użytkownika
            </span>
          </button>
        </div>
        {error && !editing && !pendingDelete && !pendingLogout ? (
          <p className="error-text" style={{margin: '12px 18px 0'}}>
            {error}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <p className="empty">Brak użytkowników.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Login</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Błędy (7d)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td>{row.displayName}</td>
                  <td>{row.username}</td>
                  <td>{row.email ?? '—'}</td>
                  <td>
                    {row.presence === 'dnd' ? (
                      <span className="badge wait">Nie przeszkadzać</span>
                    ) : row.presence === 'online' || row.online ? (
                      <span className="badge ok">Online</span>
                    ) : (
                      <span className="badge muted">Offline</span>
                    )}
                  </td>
                  <td>
                    {(row.errors7d ?? 0) > 0 ? (
                      <span className="badge danger">{row.errors7d}</span>
                    ) : (
                      <span className="badge muted">0</span>
                    )}
                    {row.lastPlatform ? (
                      <div className="hint inline-hint">
                        {row.lastPlatform}
                        {row.lastAppVersion ? ` · ${row.lastAppVersion}` : ''}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="row-actions">
                      {onOpenLogs ? (
                        <button
                          className="icon-btn"
                          type="button"
                          title="Logi użytkownika"
                          onClick={() => onOpenLogs(row.id)}>
                          <ScrollText size={16} />
                        </button>
                      ) : null}
                      {onOpenCrashes && row.lastCrash ? (
                        <button
                          className="icon-btn"
                          type="button"
                          title="Crashe użytkownika"
                          onClick={() => onOpenCrashes(row.id)}>
                          <Activity size={16} />
                        </button>
                      ) : null}
                      <button
                        className="icon-btn"
                        type="button"
                        title="Wyloguj wszędzie"
                        onClick={() => setPendingLogout(row)}>
                        <LogOut size={16} />
                      </button>
                      <button className="icon-btn" type="button" title="Edytuj" onClick={() => openEdit(row)}>
                        <Pencil size={16} />
                      </button>
                      {canDeleteUser ? (
                        <button
                          className="icon-btn danger"
                          type="button"
                          title="Usuń"
                          onClick={() => setPendingDelete(row)}>
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing ? (
        <Modal
          title={editing === 'new' ? 'Nowy użytkownik' : 'Edycja użytkownika'}
          onClose={() => setEditing(null)}>
          <form onSubmit={event => void onSave(event)}>
            <div className="field">
              <label htmlFor="user-name">Nazwa wyświetlana</label>
              <input
                id="user-name"
                className="input-field"
                required
                value={draft.displayName}
                onChange={event => setDraft({...draft, displayName: event.target.value})}
              />
            </div>
            <div className="field">
              <label htmlFor="user-login">Login</label>
              <input
                id="user-login"
                className="input-field"
                required
                autoCapitalize="off"
                value={draft.username}
                onChange={event => setDraft({...draft, username: event.target.value})}
              />
            </div>
            <div className="field">
              <label htmlFor="user-email">E-mail</label>
              <input
                id="user-email"
                className="input-field"
                type="email"
                value={draft.email}
                onChange={event => setDraft({...draft, email: event.target.value})}
              />
            </div>
            <div className="field">
              <label htmlFor="user-password">
                {editing === 'new' ? 'Hasło' : 'Nowe hasło (puste = bez zmiany)'}
              </label>
              <input
                id="user-password"
                className="input-field"
                type="password"
                required={editing === 'new'}
                minLength={
                  editing === 'new' || draft.password ? PASSWORD_MIN_LENGTH : undefined
                }
                autoComplete="new-password"
                value={draft.password}
                onChange={event => setDraft({...draft, password: event.target.value})}
              />
              <p className="hint" style={{marginTop: 8}}>
                Minimum {PASSWORD_MIN_LENGTH} znaków, bez haseł z listy zakazanych (polityka serwera).
              </p>
              {editing !== 'new' ? (
                <p className="hint" style={{marginTop: 8}}>
                  Zmiana hasła lub loginu wymaga re-seal backupu E2E. Użytkownik powinien zmienić
                  hasło w aplikacji (Ustawienia).
                  {canDestroyEncryption
                    ? ' Destrukcyjny reset poniżej czyści backup kluczy.'
                    : ''}
                </p>
              ) : null}
            </div>
            {editing !== 'new' && canDestroyEncryption ? (
              <label
                className="field"
                style={{display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  checked={draft.destroyEncryption}
                  onChange={event =>
                    setDraft({...draft, destroyEncryption: event.target.checked})
                  }
                  style={{marginTop: 3}}
                />
                <span>
                  Destrukcyjny reset E2E — usuń backup kluczy przy zmianie hasła/loginu (historia może
                  być nieodszyfrowalna)
                </span>
              </label>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}
            <div className="modal-actions">
              <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                Anuluj
              </button>
              <button className="btn-primary" type="submit" disabled={busy}>
                {busy ? 'Zapisywanie…' : 'Zapisz'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {pendingLogout ? (
        <Modal title="Wylogować wszędzie?" onClose={() => setPendingLogout(null)}>
          <p className="hint">
            Konto {pendingLogout.username} zostanie wylogowane na wszystkich urządzeniach
            (mobile, web). Sesje i tokeny push zostaną unieważnione.
          </p>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="modal-actions">
            <button className="btn-secondary" type="button" onClick={() => setPendingLogout(null)}>
              Anuluj
            </button>
            <button
              className="btn-primary"
              type="button"
              disabled={busy}
              onClick={() => void onForceLogout()}>
              Wyloguj wszędzie
            </button>
          </div>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <Modal title="Usunąć użytkownika?" onClose={() => setPendingDelete(null)}>
          <p className="hint">
            Konto {pendingDelete.username} zostanie wylogowane na wszystkich platformach, a potem
            usunięte wraz z powiązanymi czatami.
          </p>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="modal-actions">
            <button className="btn-secondary" type="button" onClick={() => setPendingDelete(null)}>
              Anuluj
            </button>
            <button className="btn-danger" type="button" disabled={busy} onClick={() => void onDelete()}>
              Usuń
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

import {FormEvent, useEffect, useState} from 'react';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {createOrgUser, deleteOrgUser, listOrgUsers, updateOrgUser} from '../api/admin';
import {errorMessage} from '../api/http';
import type {AdminUserRecord} from '../types';
import {Modal} from '../ui/Modal';

type Draft = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

const emptyDraft: Draft = {username: '', displayName: '', email: '', password: ''};

export function UsersView(): React.JSX.Element {
  const [rows, setRows] = useState<AdminUserRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<AdminUserRecord | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<AdminUserRecord | null>(null);

  async function reload(): Promise<void> {
    setRows(await listOrgUsers());
  }

  useEffect(() => {
    void reload().catch(err => setError(errorMessage(err)));
  }, []);

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
        await updateOrgUser(editing.id, {
          username: draft.username,
          displayName: draft.displayName,
          email: draft.email || null,
          password: draft.password || undefined,
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

  return (
    <>
      <div className="card">
        <div className="toolbar">
          <span className="hint">Konta komunikatora Very w organizacji.</span>
          <button className="btn-primary" type="button" onClick={openNew}>
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
              <Plus size={16} /> Dodaj użytkownika
            </span>
          </button>
        </div>
        {error && !editing && !pendingDelete ? (
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
                    {row.presence === 'online' || row.online ? (
                      <span className="badge ok">Online</span>
                    ) : row.presence === 'dnd' ? (
                      <span className="badge wait">Nie przeszkadzać</span>
                    ) : (
                      <span className="badge muted">Offline</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" type="button" title="Edytuj" onClick={() => openEdit(row)}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        type="button"
                        title="Usuń"
                        onClick={() => setPendingDelete(row)}>
                        <Trash2 size={16} />
                      </button>
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
                value={draft.password}
                onChange={event => setDraft({...draft, password: event.target.value})}
              />
            </div>
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

      {pendingDelete ? (
        <Modal title="Usunąć użytkownika?" onClose={() => setPendingDelete(null)}>
          <p className="hint">
            Konto {pendingDelete.username} i powiązane czaty zostaną usunięte z bazy.
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

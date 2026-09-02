import {FormEvent, useEffect, useState} from 'react';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  requestAdminEmailChange,
  sendAdminResetEmail,
  updateAdmin,
} from '../api/admin';
import {errorMessage} from '../api/http';
import type {AdminPublic} from '../types';
import {Modal} from '../ui/Modal';
import type {Session} from '../session';

type Props = {
  session: Session;
};

type Draft = {
  email: string;
  displayName: string;
  password: string;
};

const emptyDraft: Draft = {email: '', displayName: '', password: ''};

export function AdminsView({session}: Props): React.JSX.Element {
  const [rows, setRows] = useState<AdminPublic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<AdminPublic | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<AdminPublic | null>(null);
  const [emailChange, setEmailChange] = useState('');

  async function reload(): Promise<void> {
    setRows(await listAdmins());
  }

  useEffect(() => {
    void reload().catch(err => setError(errorMessage(err)));
  }, []);

  function openNew(): void {
    setDraft(emptyDraft);
    setEditing('new');
    setError(null);
    setNotice(null);
  }

  function openEdit(row: AdminPublic): void {
    setDraft({email: row.email ?? '', displayName: row.displayName, password: ''});
    setEditing(row);
    setEmailChange('');
    setError(null);
    setNotice(null);
  }

  const lockedBootstrap =
    editing !== null &&
    editing !== 'new' &&
    editing.isBootstrap &&
    editing.claimed;

  async function onSave(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing === 'new') {
        await createAdmin({
          email: draft.email,
          displayName: draft.displayName || undefined,
          password: draft.password || undefined,
        });
        setNotice(
          draft.password
            ? 'Administrator został utworzony.'
            : 'Wysłano zaproszenie. Nowy admin ustawi hasło z e-maila.',
        );
      } else if (editing && !lockedBootstrap) {
        await updateAdmin(editing.id, {
          email: draft.email || undefined,
          displayName: draft.displayName || undefined,
          password: draft.password || undefined,
        });
        setNotice('Zapisano zmiany.');
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
      await deleteAdmin(pendingDelete.id);
      setPendingDelete(null);
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSendReset(row: AdminPublic): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await sendAdminResetEmail(row.id);
      setNotice(`Wysłano link resetu hasła na ${row.email}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onChangeOwnEmail(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await requestAdminEmailChange(emailChange);
      setNotice(`Link potwierdzający wysłany na ${body.email}.`);
      setEditing(null);
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
          <span className="hint">Konta z dostępem do tego panelu.</span>
          <button className="btn-primary" type="button" onClick={openNew}>
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
              <Plus size={16} /> Dodaj administratora
            </span>
          </button>
        </div>
        {notice ? <p className="success-text" style={{margin: '12px 18px 0'}}>{notice}</p> : null}
        {error && !editing && !pendingDelete ? (
          <p className="error-text" style={{margin: '12px 18px 0'}}>
            {error}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <p className="empty">Brak administratorów.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Login / e-mail</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td>{row.displayName}</td>
                  <td>{row.email ?? row.username}</td>
                  <td>
                    {row.claimed ? (
                      <span className="badge ok">Aktywny</span>
                    ) : (
                      <span className="badge wait">Czeka na e-mail</span>
                    )}
                    {row.isBootstrap ? (
                      <span className="badge muted" style={{marginLeft: 6}}>
                        Główny
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" type="button" title="Edytuj" onClick={() => openEdit(row)}>
                        <Pencil size={16} />
                      </button>
                      {row.id !== session.admin.id ? (
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
          title={editing === 'new' ? 'Nowy administrator' : 'Edycja administratora'}
          onClose={() => setEditing(null)}>
          {lockedBootstrap ? (
            <div>
              <p className="hint">
                Główne konto admina po aktywacji zmienia się tylko przez e-mail: reset hasła albo
                potwierdzenie nowego adresu.
              </p>
              <div className="field" style={{marginTop: 16}}>
                <label>Aktualny e-mail</label>
                <input className="input-field" value={editing.email ?? ''} readOnly />
              </div>
              {editing.id === session.admin.id ? (
                <form onSubmit={event => void onChangeOwnEmail(event)}>
                  <div className="field">
                    <label htmlFor="new-email">Nowy e-mail</label>
                    <input
                      id="new-email"
                      className="input-field"
                      type="email"
                      value={emailChange}
                      onChange={event => setEmailChange(event.target.value)}
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                      Anuluj
                    </button>
                    <button className="btn-primary" type="submit" disabled={busy || !emailChange}>
                      Wyślij potwierdzenie
                    </button>
                  </div>
                </form>
              ) : (
                <div className="modal-actions">
                  <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                    Zamknij
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    disabled={busy}
                    onClick={() => void onSendReset(editing)}>
                    Wyślij reset hasła
                  </button>
                </div>
              )}
              {editing.id === session.admin.id ? (
                <button
                  className="btn-ghost"
                  type="button"
                  style={{marginTop: 8, paddingLeft: 0}}
                  disabled={busy}
                  onClick={() => void onSendReset(editing)}>
                  Wyślij reset hasła na aktualny e-mail
                </button>
              ) : null}
              {error ? <p className="error-text">{error}</p> : null}
            </div>
          ) : (
            <form onSubmit={event => void onSave(event)}>
              <div className="field">
                <label htmlFor="admin-name">Nazwa</label>
                <input
                  id="admin-name"
                  className="input-field"
                  value={draft.displayName}
                  onChange={event => setDraft({...draft, displayName: event.target.value})}
                />
              </div>
              <div className="field">
                <label htmlFor="admin-email">E-mail (login)</label>
                <input
                  id="admin-email"
                  className="input-field"
                  type="email"
                  required
                  value={draft.email}
                  onChange={event => setDraft({...draft, email: event.target.value})}
                />
              </div>
              <div className="field">
                <label htmlFor="admin-password">
                  {editing === 'new' ? 'Hasło (puste = zaproszenie e-mailem)' : 'Nowe hasło (puste = bez zmiany)'}
                </label>
                <input
                  id="admin-password"
                  className="input-field"
                  type="password"
                  value={draft.password}
                  onChange={event => setDraft({...draft, password: event.target.value})}
                />
              </div>
              {error ? <p className="error-text">{error}</p> : null}
              <div className="modal-actions">
                <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                  Anuluj
                </button>
                <button className="btn-primary" type="submit" disabled={busy || !draft.email}>
                  {busy ? 'Zapisywanie…' : 'Zapisz'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      ) : null}

      {pendingDelete ? (
        <Modal title="Usunąć administratora?" onClose={() => setPendingDelete(null)}>
          <p className="hint">
            Konto {pendingDelete.email ?? pendingDelete.username} straci dostęp do panelu.
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

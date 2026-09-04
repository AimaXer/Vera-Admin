import {useCallback, useEffect, useState} from 'react';
import {fetchAdminAudit} from '../api/admin';
import {errorMessage} from '../api/http';
import type {AdminAuditEntry} from '../types';

function formatTs(ts: string): string {
  if (!ts) {
    return '—';
  }
  return new Date(ts).toLocaleString('pl-PL');
}

function actorLabel(row: AdminAuditEntry): string {
  return row.actorEmail || row.actorAdminId || '—';
}

function targetLabel(row: AdminAuditEntry): string {
  if (!row.targetType && !row.targetId) {
    return '—';
  }
  if (row.targetType && row.targetId) {
    return `${row.targetType}:${row.targetId}`;
  }
  return row.targetId || row.targetType || '—';
}

export function AuditView(): React.JSX.Element {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (cursor?: string, append = false) => {
    setLoading(!append);
    setError(null);
    try {
      const result = await fetchAdminAudit({cursor, limit: 50});
      setEntries(prev => (append ? [...prev, ...result.entries] : result.entries));
      setNextCursor(result.nextCursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="card">
      <div className="toolbar">
        <span className="hint">Dziennik działań administratorów (tylko odczyt).</span>
      </div>
      {error ? (
        <p className="error-text" style={{margin: '12px 18px 0'}}>
          {error}
        </p>
      ) : null}
      {loading && entries.length === 0 ? (
        <p className="empty">Wczytywanie audytu…</p>
      ) : entries.length === 0 ? (
        <p className="empty">Brak wpisów audytu.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Akcja</th>
              <th>Aktor</th>
              <th>Cel</th>
              <th>Czas</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(row => (
              <tr key={row.id}>
                <td>
                  <code>{row.action}</code>
                </td>
                <td>{actorLabel(row)}</td>
                <td>{targetLabel(row)}</td>
                <td>{formatTs(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {nextCursor ? (
        <div className="console-more">
          <button
            className="btn-secondary"
            type="button"
            disabled={loading}
            onClick={() => void load(nextCursor, true)}>
            {loading ? 'Wczytywanie…' : 'Starsze wpisy'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

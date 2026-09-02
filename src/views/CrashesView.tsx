import {useCallback, useEffect, useState} from 'react';
import {fetchTelemetryCrashes} from '../api/admin';
import {errorMessage} from '../api/http';
import type {CrashReportRecord} from '../types';

type Props = {
  initialUserId?: string;
};

function formatTs(ts: string): string {
  return new Date(ts).toLocaleString('pl-PL');
}

export function CrashesView({initialUserId}: Props): React.JSX.Element {
  const [crashes, setCrashes] = useState<CrashReportRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(initialUserId ?? '');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string, append = false) => {
      setLoading(!append);
      setError(null);
      try {
        const result = await fetchTelemetryCrashes({
          userId: userId || undefined,
          cursor,
          limit: 50,
        });
        setCrashes(prev => (append ? [...prev, ...result.crashes] : result.crashes));
        setNextCursor(result.nextCursor);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    setUserId(initialUserId ?? '');
  }, [initialUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="telemetry-stack">
      <div className="card telemetry-toolbar">
        <span className="hint">Raporty crash z aplikacji mobilnej i web.</span>
        <div className="filter-row">
          <label htmlFor="crash-user">User ID</label>
          <input
            id="crash-user"
            className="input-field compact"
            value={userId}
            onChange={event => setUserId(event.target.value)}
            placeholder="Opcjonalnie filtruj po użytkowniku"
          />
          <button className="btn-secondary" type="button" disabled={loading} onClick={() => void load()}>
            Odśwież
          </button>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="card">
        {loading && crashes.length === 0 ? (
          <p className="empty">Wczytywanie crashy…</p>
        ) : crashes.length === 0 ? (
          <p className="empty">Brak crashy.</p>
        ) : (
          <div className="console-list">
            {crashes.map(crash => {
              const open = expanded === crash.id;
              return (
                <div key={crash.id} className="console-row">
                  <button
                    type="button"
                    className="console-head"
                    onClick={() => setExpanded(open ? null : crash.id)}>
                    <span className="badge danger">crash</span>
                    <span className="console-ts">{formatTs(crash.ts)}</span>
                    <span className="console-source">{crash.platform ?? '?'}</span>
                    <span className="console-msg">{crash.message}</span>
                  </button>
                  {open ? (
                    <div className="console-detail">
                      {crash.userId ? <div>userId: {crash.userId}</div> : null}
                      {crash.appVersion ? <div>wersja: {crash.appVersion}</div> : null}
                      {crash.stack ? <pre>{crash.stack}</pre> : null}
                      {crash.breadcrumbs.length > 0 ? (
                        <>
                          <strong>Breadcrumbs</strong>
                          <pre>{crash.breadcrumbs.join('\n')}</pre>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
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
    </div>
  );
}

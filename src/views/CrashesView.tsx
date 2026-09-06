import {useCallback, useEffect, useRef, useState} from 'react';
import {fetchTelemetryCrashes} from '../api/admin';
import {errorMessage} from '../api/http';
import {mergeByIdFront, useLiveRefresh} from '../hooks/useLiveRefresh';
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
  const pagedRef = useRef(false);
  const loadGen = useRef(0);
  const explicitBusy = useRef(false);

  const load = useCallback(
    async (opts?: {cursor?: string; append?: boolean; silent?: boolean}) => {
      const append = opts?.append ?? false;
      const silent = opts?.silent ?? false;
      if (silent && explicitBusy.current) {
        return;
      }
      const gen = silent ? loadGen.current : ++loadGen.current;
      if (!silent) {
        explicitBusy.current = true;
        setLoading(!append);
        setError(null);
      }
      try {
        const result = await fetchTelemetryCrashes({
          userId: userId || undefined,
          cursor: opts?.cursor,
          limit: 50,
        });
        if (gen !== loadGen.current || (silent && explicitBusy.current)) {
          return;
        }
        if (append) {
          pagedRef.current = true;
          setCrashes(prev => [...prev, ...result.crashes]);
          setNextCursor(result.nextCursor);
        } else if (silent && pagedRef.current) {
          setCrashes(prev => mergeByIdFront(prev, result.crashes));
        } else {
          pagedRef.current = false;
          setCrashes(result.crashes);
          setNextCursor(result.nextCursor);
        }
        setError(null);
      } catch (err) {
        if (gen !== loadGen.current || silent) {
          return;
        }
        setError(errorMessage(err));
      } finally {
        if (!silent && gen === loadGen.current) {
          explicitBusy.current = false;
          setLoading(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    setUserId(initialUserId ?? '');
  }, [initialUserId]);

  useEffect(() => {
    pagedRef.current = false;
    void load();
  }, [load]);

  useLiveRefresh(() => load({silent: true}));

  return (
    <div className="telemetry-stack">
      <div className="card telemetry-toolbar">
        <span className="hint">Raporty crash z aplikacji mobilnej i web. Lista odświeża się na żywo.</span>
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
              onClick={() => void load({cursor: nextCursor, append: true})}>
              {loading ? 'Wczytywanie…' : 'Starsze wpisy'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

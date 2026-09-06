import {FormEvent, useCallback, useEffect, useRef, useState} from 'react';
import {fetchTelemetryEvents} from '../api/admin';
import {errorMessage} from '../api/http';
import {mergeByIdFront, useLiveRefresh} from '../hooks/useLiveRefresh';
import type {TelemetryEventRecord, TelemetryLevel} from '../types';

type Props = {
  initialUserId?: string;
};

const LEVELS: Array<TelemetryLevel | ''> = ['', 'warn', 'error', 'fatal', 'info'];
const SOURCES = ['', 'mobile', 'web', 'api'];

function formatTs(ts: string): string {
  return new Date(ts).toLocaleString('pl-PL');
}

function levelClass(level: TelemetryLevel): string {
  if (level === 'error' || level === 'fatal') {
    return 'badge danger';
  }
  if (level === 'warn') {
    return 'badge wait';
  }
  return 'badge muted';
}

export function ConsoleView({initialUserId}: Props): React.JSX.Element {
  const [events, setEvents] = useState<TelemetryEventRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('');
  const [source, setSource] = useState('');
  const [userId, setUserId] = useState(initialUserId ?? '');
  const [q, setQ] = useState('');
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
        const result = await fetchTelemetryEvents({
          level: level || undefined,
          source: source || undefined,
          userId: userId || undefined,
          q: q || undefined,
          cursor: opts?.cursor,
          limit: 80,
        });
        if (gen !== loadGen.current || (silent && explicitBusy.current)) {
          return;
        }
        if (append) {
          pagedRef.current = true;
          setEvents(prev => [...prev, ...result.events]);
          setNextCursor(result.nextCursor);
        } else if (silent && pagedRef.current) {
          setEvents(prev => mergeByIdFront(prev, result.events));
        } else {
          pagedRef.current = false;
          setEvents(result.events);
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
    [level, q, source, userId],
  );

  useEffect(() => {
    setUserId(initialUserId ?? '');
  }, [initialUserId]);

  useEffect(() => {
    pagedRef.current = false;
    void load();
  }, [load]);

  useLiveRefresh(() => load({silent: true}));

  function onFilter(event: FormEvent): void {
    event.preventDefault();
    void load();
  }

  return (
    <div className="telemetry-stack">
      <form className="card telemetry-toolbar" onSubmit={onFilter}>
        <div className="filter-grid">
          <div className="field compact">
            <label htmlFor="console-level">Poziom</label>
            <select
              id="console-level"
              className="input-field compact"
              value={level}
              onChange={event => setLevel(event.target.value)}>
              {LEVELS.map(value => (
                <option key={value || 'all'} value={value}>
                  {value || 'Wszystkie'}
                </option>
              ))}
            </select>
          </div>
          <div className="field compact">
            <label htmlFor="console-source">Źródło</label>
            <select
              id="console-source"
              className="input-field compact"
              value={source}
              onChange={event => setSource(event.target.value)}>
              {SOURCES.map(value => (
                <option key={value || 'all'} value={value}>
                  {value || 'Wszystkie'}
                </option>
              ))}
            </select>
          </div>
          <div className="field compact">
            <label htmlFor="console-user">User ID</label>
            <input
              id="console-user"
              className="input-field compact"
              value={userId}
              onChange={event => setUserId(event.target.value)}
              placeholder="UUID użytkownika"
            />
          </div>
          <div className="field compact">
            <label htmlFor="console-q">Szukaj</label>
            <input
              id="console-q"
              className="input-field compact"
              value={q}
              onChange={event => setQ(event.target.value)}
              placeholder="Wiadomość, scope, reqId…"
            />
          </div>
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          Filtruj
        </button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="card">
        {loading && events.length === 0 ? (
          <p className="empty">Wczytywanie logów…</p>
        ) : events.length === 0 ? (
          <p className="empty">Brak zdarzeń dla filtrów.</p>
        ) : (
          <div className="console-list">
            {events.map(event => {
              const open = expanded === event.id;
              return (
                <div key={event.id} className="console-row">
                  <button
                    type="button"
                    className="console-head"
                    onClick={() => setExpanded(open ? null : event.id)}>
                    <span className={levelClass(event.level)}>{event.level}</span>
                    <span className="console-ts">{formatTs(event.ts)}</span>
                    <span className="console-source">{event.source}</span>
                    <span className="console-scope">[{event.scope}]</span>
                    <span className="console-msg">{event.message}</span>
                  </button>
                  {open ? (
                    <div className="console-detail">
                      {event.userId ? <div>userId: {event.userId}</div> : null}
                      {event.reqId ? <div>reqId: {event.reqId}</div> : null}
                      {event.platform ? (
                        <div>
                          {event.platform} · {event.appVersion ?? '?'}
                        </div>
                      ) : null}
                      {event.errorCode ? <div>code: {event.errorCode}</div> : null}
                      {event.httpStatus ? <div>HTTP {event.httpStatus}</div> : null}
                      {event.stack ? <pre>{event.stack}</pre> : null}
                      {event.meta ? <pre>{JSON.stringify(event.meta, null, 2)}</pre> : null}
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

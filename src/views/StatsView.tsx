import {useEffect, useMemo, useState} from 'react';
import {fetchTelemetryStats} from '../api/admin';
import {errorMessage} from '../api/http';
import type {TelemetryStats} from '../types';

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function formatDay(day: string): string {
  return day.slice(5);
}

export function StatsView(): React.JSX.Element {
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const from = isoDaysAgo(rangeDays);
    void fetchTelemetryStats(from)
      .then(setStats)
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [rangeDays]);

  const chartRows = useMemo(() => {
    if (!stats) {
      return [];
    }
    const byDay = new Map<string, number>();
    for (const row of stats.byDay) {
      if (row.level === 'error' || row.level === 'fatal') {
        byDay.set(row.day, (byDay.get(row.day) ?? 0) + row.count);
      }
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({day, count}));
  }, [stats]);

  const maxChart = Math.max(1, ...chartRows.map(row => row.count));

  return (
    <div className="telemetry-stack">
      <div className="card telemetry-toolbar">
        <span className="hint">Agregaty z ostatnich dni (API + aplikacje).</span>
        <div className="filter-row">
          <label htmlFor="stats-range">Zakres</label>
          <select
            id="stats-range"
            className="input-field compact"
            value={rangeDays}
            onChange={event => setRangeDays(Number(event.target.value))}>
            <option value={7}>7 dni</option>
            <option value={14}>14 dni</option>
            <option value={30}>30 dni</option>
          </select>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="empty">Wczytywanie statystyk…</p> : null}

      {stats && !loading ? (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Crashe</span>
              <strong className="stat-value danger">{stats.crashes}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Błędy</span>
              <strong className="stat-value danger">{stats.errors}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Ostrzeżenia</span>
              <strong className="stat-value warn">{stats.warnings}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Użytkownicy z błędami</span>
              <strong className="stat-value">{stats.usersWithErrors}</strong>
            </div>
          </div>

          <div className="card telemetry-panel">
            <h2>Błędy wg dnia</h2>
            {chartRows.length === 0 ? (
              <p className="empty">Brak błędów w tym okresie.</p>
            ) : (
              <div className="bar-chart">
                {chartRows.map(row => (
                  <div key={row.day} className="bar-row">
                    <span className="bar-label">{formatDay(row.day)}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{width: `${(row.count / maxChart) * 100}%`}}
                      />
                    </div>
                    <span className="bar-count">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="telemetry-columns">
            <div className="card telemetry-panel">
              <h2>Źródło</h2>
              {Object.keys(stats.bySource).length === 0 ? (
                <p className="empty">Brak danych.</p>
              ) : (
                <ul className="simple-list">
                  {Object.entries(stats.bySource).map(([source, count]) => (
                    <li key={source}>
                      <span>{source}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card telemetry-panel">
              <h2>Top kody błędów</h2>
              {stats.topErrorCodes.length === 0 ? (
                <p className="empty">Brak kodów.</p>
              ) : (
                <ul className="simple-list">
                  {stats.topErrorCodes.map(row => (
                    <li key={row.errorCode}>
                      <span>{row.errorCode}</span>
                      <strong>{row.count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card telemetry-panel">
              <h2>Top scope</h2>
              {stats.topScopes.length === 0 ? (
                <p className="empty">Brak danych.</p>
              ) : (
                <ul className="simple-list">
                  {stats.topScopes.map(row => (
                    <li key={row.scope}>
                      <span>{row.scope}</span>
                      <strong>{row.count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

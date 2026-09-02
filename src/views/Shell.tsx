import {AlertTriangle, BarChart3, LogOut, Shield, Terminal, Users} from 'lucide-react';
import type {Session} from '../session';
import {AdminsView} from './AdminsView';
import {ConsoleView} from './ConsoleView';
import {CrashesView} from './CrashesView';
import {StatsView} from './StatsView';
import {UsersView} from './UsersView';

export type AdminTab = 'admins' | 'users' | 'stats' | 'console' | 'crashes';

type Props = {
  session: Session;
  tab: AdminTab;
  consoleUserId?: string;
  onTab: (tab: AdminTab, userId?: string) => void;
  onLogout: () => void;
};

const TAB_META: Record<
  AdminTab,
  {title: string; subtitle: string}
> = {
  admins: {
    title: 'Administratorzy',
    subtitle: 'Kto może logować się do tego panelu.',
  },
  users: {
    title: 'Użytkownicy organizacji',
    subtitle: 'Konta aplikacji Vera: tworzenie, loginy i hasła.',
  },
  stats: {
    title: 'Statystyki',
    subtitle: 'Agregaty błędów, crashy i aktywności telemetrycznej.',
  },
  console: {
    title: 'Konsola logów',
    subtitle: 'Zdarzenia z aplikacji mobilnej, web i API.',
  },
  crashes: {
    title: 'Crashe',
    subtitle: 'Raporty awarii z breadcrumbs i stack trace.',
  },
};

export function Shell({session, tab, consoleUserId, onTab, onLogout}: Props): React.JSX.Element {
  const meta = TAB_META[tab];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/vera-icon.png" alt="" />
          <div>
            <strong>Vera Admin</strong>
            <span>Organizacja</span>
          </div>
        </div>
        <nav>
          <button
            type="button"
            className={`nav-btn${tab === 'admins' ? ' active' : ''}`}
            onClick={() => onTab('admins')}>
            <Shield size={18} />
            Administratorzy
          </button>
          <button
            type="button"
            className={`nav-btn${tab === 'users' ? ' active' : ''}`}
            onClick={() => onTab('users')}>
            <Users size={18} />
            Użytkownicy
          </button>
          <button
            type="button"
            className={`nav-btn${tab === 'stats' ? ' active' : ''}`}
            onClick={() => onTab('stats')}>
            <BarChart3 size={18} />
            Statystyki
          </button>
          <button
            type="button"
            className={`nav-btn${tab === 'console' ? ' active' : ''}`}
            onClick={() => onTab('console')}>
            <Terminal size={18} />
            Konsola
          </button>
          <button
            type="button"
            className={`nav-btn${tab === 'crashes' ? ' active' : ''}`}
            onClick={() => onTab('crashes')}>
            <AlertTriangle size={18} />
            Crashe
          </button>
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-user">{session.admin.email ?? session.admin.username}</div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            Wyloguj
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="main-header">
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </header>
        <div className="main-body">
          {tab === 'admins' ? <AdminsView session={session} /> : null}
          {tab === 'users' ? (
            <UsersView
              onOpenLogs={userId => onTab('console', userId)}
              onOpenCrashes={userId => onTab('crashes', userId)}
            />
          ) : null}
          {tab === 'stats' ? <StatsView /> : null}
          {tab === 'console' ? <ConsoleView initialUserId={consoleUserId} /> : null}
          {tab === 'crashes' ? <CrashesView initialUserId={consoleUserId} /> : null}
        </div>
      </main>
    </div>
  );
}

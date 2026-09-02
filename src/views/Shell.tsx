import {LogOut, Shield, Users} from 'lucide-react';
import type {Session} from '../session';
import {AdminsView} from './AdminsView';
import {UsersView} from './UsersView';

export type AdminTab = 'admins' | 'users';

type Props = {
  session: Session;
  tab: AdminTab;
  onTab: (tab: AdminTab) => void;
  onLogout: () => void;
};

export function Shell({session, tab, onTab, onLogout}: Props): React.JSX.Element {
  const title = tab === 'admins' ? 'Administratorzy' : 'Użytkownicy organizacji';
  const subtitle =
    tab === 'admins'
      ? 'Kto może logować się do tego panelu.'
      : 'Konta aplikacji Vera: tworzenie, loginy i hasła.';

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
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        <div className="main-body">
          {tab === 'admins' ? <AdminsView session={session} /> : <UsersView />}
        </div>
      </main>
    </div>
  );
}

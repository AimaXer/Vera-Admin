import {useEffect, useState} from 'react';
import {navigate, persistToken, restoreSession, type Session} from './session';
import {ClaimEmailView} from './views/ClaimEmailView';
import {ConfirmEmailView} from './views/ConfirmEmailView';
import {ForgotView} from './views/ForgotView';
import {LoginView} from './views/LoginView';
import {SetPasswordView} from './views/SetPasswordView';
import {Shell, type AdminTab} from './views/Shell';

function currentPath(): string {
  return window.location.pathname;
}

export default function App(): React.JSX.Element {
  const [path, setPath] = useState(currentPath);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<AdminTab>('admins');
  const [consoleUserId, setConsoleUserId] = useState<string | undefined>();

  function onTab(next: AdminTab, userId?: string): void {
    setTab(next);
    setConsoleUserId(userId);
  }

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    void restoreSession().then(value => {
      setSession(value);
      setReady(true);
    });
  }, []);

  function logout(): void {
    persistToken(null);
    setSession(null);
    navigate('/login');
  }

  if (!ready) {
    return (
      <div className="auth-screen">
        <div className="auth-card" style={{textAlign: 'center'}}>
          <img className="auth-logo" src="/vera-icon.png" alt="" />
          <p className="auth-sub" style={{marginBottom: 0}}>
            Wczytywanie…
          </p>
        </div>
      </div>
    );
  }

  if (path === '/zapomniane-haslo') {
    return <ForgotView />;
  }
  if (path === '/ustaw-haslo') {
    return <SetPasswordView mode="setup" />;
  }
  if (path === '/reset-hasla') {
    return <SetPasswordView mode="reset" />;
  }
  if (path === '/zmiana-emaila') {
    return <ConfirmEmailView />;
  }

  if (!session) {
    return <LoginView onLoggedIn={setSession} />;
  }

  if (session.mustClaimEmail) {
    return <ClaimEmailView session={session} onLogout={logout} />;
  }

  return (
    <Shell
      session={session}
      tab={tab}
      consoleUserId={consoleUserId}
      onTab={onTab}
      onLogout={logout}
    />
  );
}

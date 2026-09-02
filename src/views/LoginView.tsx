import {FormEvent, useState} from 'react';
import {adminLogin} from '../api/admin';
import {errorMessage} from '../api/http';
import {navigate, persistToken, type Session} from '../session';

type Props = {
  onLoggedIn: (session: Session) => void;
};

export function LoginView({onLoggedIn}: Props): React.JSX.Element {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await adminLogin(login, password);
      persistToken(body.token);
      onLoggedIn({
        token: body.token,
        admin: body.admin,
        mustClaimEmail: body.mustClaimEmail,
      });
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={event => void onSubmit(event)}>
        <img className="auth-logo" src="/vera-icon.png" alt="" />
        <h1 className="auth-title">Vera Admin</h1>
        <p className="auth-sub">Panel zarządzania organizacją</p>
        <div className="field">
          <label htmlFor="login">E-mail lub login</label>
          <input
            id="login"
            className="input-field"
            autoComplete="username"
            autoCapitalize="off"
            value={login}
            onChange={event => setLogin(event.target.value)}
            placeholder="admin"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Hasło</label>
          <input
            id="password"
            className="input-field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button className="btn-primary" type="submit" disabled={busy || !login || !password} style={{width: '100%'}}>
          {busy ? 'Logowanie…' : 'Zaloguj się'}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn-ghost" type="button" style={{width: '100%', marginTop: 8}} onClick={() => navigate('/zapomniane-haslo')}>
          Nie pamiętam hasła
        </button>
      </form>
    </div>
  );
}

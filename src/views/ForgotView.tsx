import {FormEvent, useState} from 'react';
import {forgotAdminPassword} from '../api/admin';
import {errorMessage} from '../api/http';
import {navigate} from '../session';

export function ForgotView(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await forgotAdminPassword(email);
      setDone(true);
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
        <h1 className="auth-title">Reset hasła</h1>
        <p className="auth-sub">
          Podaj e-mail konta administratora. Jeśli konto istnieje, wyślemy link do ustawienia
          nowego hasła.
        </p>
        {done ? (
          <p className="success-text" style={{marginTop: 0}}>
            Jeśli konto istnieje, link jest już w drodze. Gdy SMTP nie jest skonfigurowane, znajdziesz
            go w logach Vera-API.
          </p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                className="input-field"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={busy || !email} style={{width: '100%'}}>
              {busy ? 'Wysyłanie…' : 'Wyślij link'}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </>
        )}
        <button className="btn-ghost" type="button" style={{width: '100%', marginTop: 8}} onClick={() => navigate('/login')}>
          Wróć do logowania
        </button>
      </form>
    </div>
  );
}

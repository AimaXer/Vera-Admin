import {FormEvent, useState} from 'react';
import {claimAdminEmail} from '../api/admin';
import {errorMessage} from '../api/http';
import type {Session} from '../session';

type Props = {
  session: Session;
  onLogout: () => void;
};

export function ClaimEmailView({session, onLogout}: Props): React.JSX.Element {
  const [email, setEmail] = useState(session.admin.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await claimAdminEmail(email);
      setSentTo(body.email);
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
        <h1 className="auth-title">Aktywacja konta</h1>
        <p className="auth-sub">
          Zalogowałeś się tymczasowym loginem <strong>admin</strong>. Podaj prawdziwy e-mail — wyślemy
          na niego link do ustawienia hasła. Potem logujesz się już tylko tym adresem.
        </p>
        {sentTo ? (
          <p className="success-text" style={{marginTop: 0}}>
            Link wysłany na {sentTo}. Otwórz go i ustaw hasło. Jeśli nie masz SMTP, skopiuj URL z logów
            Vera-API.
          </p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="email">E-mail administratora</label>
              <input
                id="email"
                className="input-field"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="jan@firma.pl"
              />
            </div>
            <button className="btn-primary" type="submit" disabled={busy || !email} style={{width: '100%'}}>
              {busy ? 'Wysyłanie…' : 'Wyślij link aktywacyjny'}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </>
        )}
        <button className="btn-ghost" type="button" style={{width: '100%', marginTop: 8}} onClick={onLogout}>
          Wyloguj
        </button>
      </form>
    </div>
  );
}

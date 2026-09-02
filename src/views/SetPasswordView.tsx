import {FormEvent, useState} from 'react';
import {completeAdminSetup, resetAdminPassword} from '../api/admin';
import {errorMessage} from '../api/http';
import {navigate, queryParam} from '../session';

type Props = {
  mode: 'setup' | 'reset';
};

export function SetPasswordView({mode}: Props): React.JSX.Element {
  const token = queryParam('token') ?? '';
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  const title = mode === 'setup' ? 'Ustaw hasło administratora' : 'Nowe hasło';
  const sub =
    mode === 'setup'
      ? 'To hasło będzie służyć do logowania e-mailem do panelu Vera Admin.'
      : 'Ustaw nowe hasło do panelu administratora.';

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (password !== repeat) {
      setError('Hasła muszą być identyczne.');
      return;
    }
    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'setup') {
        const body = await completeAdminSetup(token, password);
        setDoneEmail(body.email);
      } else {
        await resetAdminPassword(token, password);
        setDoneEmail('ok');
      }
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
        <h1 className="auth-title">{title}</h1>
        <p className="auth-sub">{sub}</p>
        {!token ? (
          <p className="error-text" style={{marginTop: 0}}>
            Brak tokenu w adresie. Otwórz link z e-maila.
          </p>
        ) : doneEmail ? (
          <p className="success-text" style={{marginTop: 0}}>
            {mode === 'setup'
              ? `Hasło ustawione. Zaloguj się adresem ${doneEmail}.`
              : 'Hasło zostało zmienione. Możesz się zalogować.'}
          </p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="password">Nowe hasło</label>
              <input
                id="password"
                className="input-field"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="repeat">Powtórz hasło</label>
              <input
                id="repeat"
                className="input-field"
                type="password"
                autoComplete="new-password"
                value={repeat}
                onChange={event => setRepeat(event.target.value)}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={busy || !password || !repeat} style={{width: '100%'}}>
              {busy ? 'Zapisywanie…' : 'Zapisz hasło'}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </>
        )}
        <button className="btn-ghost" type="button" style={{width: '100%', marginTop: 8}} onClick={() => navigate('/login')}>
          Przejdź do logowania
        </button>
      </form>
    </div>
  );
}

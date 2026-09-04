import {useEffect, useState} from 'react';
import {confirmAdminEmail} from '../api/admin';
import {errorMessage} from '../api/http';
import {navigate, readUrlToken} from '../session';


export function ConfirmEmailView(): React.JSX.Element {
  const [token] = useState(() => readUrlToken('token') ?? '');
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setDetail('Brak tokenu w adresie. Otwórz link z e-maila.');
      return;
    }
    void confirmAdminEmail(token)
      .then(body => {
        setStatus('ok');
        setDetail(`Nowy e-mail potwierdzony: ${body.email}. Zaloguj się tym adresem.`);
      })
      .catch(err => {
        setStatus('error');
        setDetail(errorMessage(err));
      });
  }, [token]);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img className="auth-logo" src="/vera-icon.png" alt="" />
        <h1 className="auth-title">Zmiana e-maila</h1>
        <p className={status === 'error' ? 'error-text' : 'auth-sub'}>
          {status === 'working' ? 'Potwierdzanie adresu…' : detail}
        </p>
        <button className="btn-primary" type="button" style={{width: '100%'}} onClick={() => navigate('/login')}>
          Przejdź do logowania
        </button>
      </div>
    </div>
  );
}

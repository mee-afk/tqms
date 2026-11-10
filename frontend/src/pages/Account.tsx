import { useState } from 'react';
import { request } from '../api';
import { Head } from '../components/Controls';
export function Account({
  mode,
  onDone
}: {
  mode: 'login' | 'profile' | 'password';
  onDone?: () => void;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  if (mode === 'profile') return <>
    <Head title="My profile" section="Profile" />
    <article className="panel details">{Object.entries({
      'Checkpoint name': 'Thankot checkpoint',
      'Province': 'Bagmati (P3)',
      'District': 'Kathmandu',
      'Region': 'Bagmati Province',
      'Geo location': '—',
      'Status': 'Active',
      'Sthaniya Sangh': 'Bagmati Yatayat Sangh',
      'Email': 'thankot@example.com',
      'Checkpoint type': 'Checkpoint with weighing bridge'
    }).map(([k, v]) => <div key={k}>
      <small>{k}</small>
      <strong>{v}</strong>
    </div>)}</article>
  </>;
  const login = mode === 'login';
  return <div className={login ? 'login' : 'account-form'}>
    {login && <img className="login-logo" src="/lodbod-logo.png" alt="Lodbod" width="157" height="40" />}
    <Head
      title={login ? 'Sign in' : 'Change password'}
      section={login ? 'Lodbod TQMS' : 'Account'}
    />
    <form
      className="panel"
      onSubmit={async e => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          const data: Record<string, string> = {};
          new FormData(e.currentTarget).forEach((v, k) => {
            data[k] = String(v);
          });
          await request(login ? '/login' : '/password', 'POST', data);
          if (login) onDone?.(); else location.assign('/');
        } catch (ex) {
          setError((ex as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {(login
        ? [['username', 'User name'], ['password', 'Password']]
        : [
          ['current', 'Current password'],
          ['password', 'New password'],
          ['confirm', 'Confirm password']
        ]).map(([k, l]) => <label key={k}>
          {l}
          <input
            required
            name={k}
            type={k === 'username' ? 'text' : 'password'}
            autoComplete={k === 'username' ? 'username' : login || k === 'current' ? 'current-password' : 'new-password'}
          />
        </label>)}
      {login && <label className="inline">
        <input type="checkbox" name="remember" />
        {" Remember me"}
      </label>}
      {error && <p role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{login ? 'Sign in' : 'Save password'}</button>
    </form>
  </div>;
}

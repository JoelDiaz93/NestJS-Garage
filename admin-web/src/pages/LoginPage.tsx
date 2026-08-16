import { useEffect, useState, type FormEvent } from 'react';
import { healthCheck, login } from '../api/client';
import { config } from '../config';
import { Alert, errorMessage } from '../components/ui';
import type { Session } from '../types';

export function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState(config.demoEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { void healthCheck().then(setApiOnline); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError('');
    try { onLogin(await login(email, password)); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }

  return <main className="login-screen">
    <section className="login-card">
      <div className="login-brand"><span className="logo-mark large">GF</span><div><p className="eyebrow">Workshop Management</p><h1>GarageFlow</h1></div></div>
      <p className="login-copy">Administra clientes, vehículos, inventario, cotizaciones y órdenes de trabajo desde un solo lugar.</p>
      {config.freeHosting && <Alert tone="info">La demo usa hosting gratuito. Si la API estaba suspendida, el primer acceso puede tardar mientras el servicio inicia.</Alert>}
      {apiOnline === false && <Alert tone="info">La API todavía no responde. Puedes volver a intentar el inicio de sesión en unos segundos.</Alert>}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} className="login-form">
        <label>Correo<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>
        <button className="primary" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
      <small className="endpoint-note">API: {config.apiUrl}</small>
    </section>
  </main>;
}

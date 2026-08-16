import { FormEvent, useState } from 'react';
import { login } from '../api';
import type { Session } from '../types';

export function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState(import.meta.env.VITE_DEMO_EMAIL ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      onLogin(await login(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">GF</div>
        <p className="eyebrow">Workshop Operations</p>
        <h1>GarageFlow</h1>
        <p className="muted">Control de clientes, inventario, cotizaciones y órdenes de trabajo.</p>
        {import.meta.env.VITE_FREE_HOSTING === 'true' && (
          <p className="muted"><strong>Demo gratuita:</strong> si el API estaba inactivo, el primer ingreso puede tardar mientras el servidor despierta.</p>
        )}
        <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </main>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { Alert, EmptyState, PageHeader, errorMessage } from '../components/ui';
import type { User, UserRole } from '../types';

const roles: { value: UserRole; label: string }[] = [{ value: 'admin', label: 'Administrador' }, { value: 'advisor', label: 'Asesor' }, { value: 'technician', label: 'Técnico' }];

export function UsersPage({ currentUserId }: { currentUserId: string }) {
  const [rows, setRows] = useState<User[]>([]); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'advisor' as UserRole });
  async function load() { try { setRows(await api<User[]>('/users')); setError(''); } catch (err) { setError(errorMessage(err)); } }
  useEffect(() => { void load(); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    try { await api('/users', { method: 'POST', body: JSON.stringify({ email: form.email, fullName: form.fullName, password: form.password, roles: [form.role] }) }); setForm({ email: '', fullName: '', password: '', role: 'advisor' }); setSuccess('Usuario creado correctamente.'); await load(); }
    catch (err) { setError(errorMessage(err)); }
  }

  async function patch(user: User, data: Record<string, unknown>) { try { setError(''); await api(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(data) }); await load(); } catch (err) { setError(errorMessage(err)); } }
  async function resetPassword(user: User) {
    const password = window.prompt(`Nueva contraseña para ${user.fullName} (mínimo 12 caracteres)`); if (!password) return;
    if (password.length < 12) { setError('La contraseña debe tener al menos 12 caracteres.'); return; }
    try { await api(`/users/${user.id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }); setSuccess(`Contraseña de ${user.fullName} actualizada y sesiones revocadas.`); }
    catch (err) { setError(errorMessage(err)); }
  }

  return <>
    <PageHeader eyebrow="Seguridad y acceso" title="Usuarios" />
    {error && <Alert>{error}</Alert>}{success && <Alert tone="success">{success}</Alert>}
    <form className="panel form-grid" onSubmit={create}><h3 className="full">Nuevo usuario</h3><label>Nombre<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required minLength={2} /></label><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label>Contraseña<input type="password" minLength={12} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label><label>Rol<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label><div className="full"><button className="primary">Crear usuario</button></div></form>
    <section className="panel">{rows.length === 0 ? <EmptyState>No hay usuarios.</EmptyState> : <div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{rows.map((user) => <tr key={user.id}><td><strong>{user.fullName}</strong><small>{user.email}</small></td><td><select value={user.roles[0] || 'advisor'} disabled={user.id === currentUserId} onChange={(e) => void patch(user, { roles: [e.target.value] })}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></td><td><span className={`badge ${user.isActive ? 'success' : 'danger'}`}>{user.isActive ? 'Activo' : 'Inactivo'}</span></td><td><div className="actions"><button disabled={user.id === currentUserId} onClick={() => void patch(user, { isActive: !user.isActive })}>{user.isActive ? 'Desactivar' : 'Activar'}</button><button onClick={() => void resetPassword(user)}>Restablecer clave</button></div></td></tr>)}</tbody></table></div>}</section>
  </>;
}

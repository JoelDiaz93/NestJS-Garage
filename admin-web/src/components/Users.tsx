import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { User, UserRole } from '../types';

const roles: UserRole[] = ['admin', 'advisor', 'technician'];

export function Users({ currentUserId }: { currentUserId: string }) {
  const [rows, setRows] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'advisor' as UserRole });

  const load = () => api<User[]>('/users').then(setRows).catch((e) => setError(message(e)));
  useEffect(() => { void load(); }, []);

  async function create(event: FormEvent) {
    event.preventDefault(); setError('');
    try {
      await api('/users', { method: 'POST', body: JSON.stringify({ email: form.email, fullName: form.fullName, password: form.password, roles: [form.role] }) });
      setForm({ email: '', fullName: '', password: '', role: 'advisor' });
      await load();
    } catch (e) { setError(message(e)); }
  }

  async function patch(user: User, data: Record<string, unknown>) {
    try { await api(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(data) }); await load(); }
    catch (e) { setError(message(e)); }
  }

  async function resetPassword(user: User) {
    const password = window.prompt(`Nueva contraseña para ${user.fullName} (mínimo 12 caracteres)`);
    if (!password) return;
    try { await api(`/users/${user.id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }); }
    catch (e) { setError(message(e)); }
  }

  return <>
    <section className="section-heading"><div><p className="eyebrow">Seguridad y acceso</p><h2>Usuarios</h2></div></section>
    {error && <div className="alert error">{error}</div>}
    <form className="panel form-grid" onSubmit={create}>
      <h3 className="full">Nuevo usuario</h3>
      <label>Nombre<input value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} required /></label>
      <label>Email<input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required /></label>
      <label>Contraseña<input type="password" minLength={12} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required /></label>
      <label>Rol<select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value as UserRole})}>{roles.map(role=><option key={role} value={role}>{role}</option>)}</select></label>
      <div className="full"><button className="primary">Crear usuario</button></div>
    </form>
    <section className="panel"><div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Roles</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {rows.map(user=><tr key={user.id}><td><strong>{user.fullName}</strong><small>{user.email}</small></td><td><select value={user.roles[0]??'advisor'} disabled={user.id===currentUserId} onChange={(e)=>patch(user,{roles:[e.target.value]})}>{roles.map(role=><option key={role}>{role}</option>)}</select></td><td><span className={`badge ${user.isActive?'success':'danger'}`}>{user.isActive?'Activo':'Inactivo'}</span></td><td className="actions"><button disabled={user.id===currentUserId} onClick={()=>patch(user,{isActive:!user.isActive})}>{user.isActive?'Desactivar':'Activar'}</button><button onClick={()=>resetPassword(user)}>Restablecer clave</button></td></tr>)}
    </tbody></table></div></section>
  </>;
}

const message = (error: unknown) => error instanceof Error ? error.message : 'Error inesperado';

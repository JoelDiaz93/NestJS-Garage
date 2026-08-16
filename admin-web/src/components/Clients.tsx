import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { Client } from '../types';

export function Clients() {
  const [rows, setRows] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', document: '', email: '', phone: '', address: '' });

  const load = () => api<Client[]>('/clients').then(setRows).catch(showError);
  useEffect(() => { void load(); }, []);
  const showError = (err: unknown) => setError(err instanceof Error ? err.message : 'Error inesperado');

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    try {
      await api('/clients', { method: 'POST', body: JSON.stringify({ ...form, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined }) });
      setForm({ fullName: '', document: '', email: '', phone: '', address: '' }); await load();
    } catch (err) { showError(err); }
  }

  return <>
    <section className="section-heading"><div><p className="eyebrow">CRM</p><h2>Clientes</h2></div></section>
    {error && <div className="alert error">{error}</div>}
    <form className="panel form-grid" onSubmit={submit}>
      <h3 className="full">Nuevo cliente</h3>
      <label>Nombre<input value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} required /></label>
      <label>Documento<input value={form.document} onChange={(e)=>setForm({...form,document:e.target.value})} required /></label>
      <label>Email<input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} /></label>
      <label>Teléfono<input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} /></label>
      <label className="span-2">Dirección<input value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} /></label>
      <div className="full"><button className="primary">Guardar cliente</button></div>
    </form>
    <section className="panel"><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Documento</th><th>Contacto</th><th>Estado</th></tr></thead><tbody>
      {rows.map((x)=><tr key={x.id}><td><strong>{x.fullName}</strong><small>{x.address}</small></td><td>{x.document}</td><td>{x.email ?? '—'}<small>{x.phone}</small></td><td><span className={`badge ${x.active?'success':'neutral'}`}>{x.active?'Activo':'Inactivo'}</span></td></tr>)}
    </tbody></table></div></section>
  </>;
}

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { Alert, EmptyState, PageHeader, errorMessage } from '../components/ui';
import type { Client } from '../types';

const emptyForm = { fullName: '', document: '', email: '', phone: '', address: '' };

export function ClientsPage() {
  const [rows, setRows] = useState<Client[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load(term = search) {
    try { setRows(await api<Client[]>(`/clients${term.trim() ? `?search=${encodeURIComponent(term.trim())}` : ''}`)); setError(''); }
    catch (err) { setError(errorMessage(err)); }
  }
  useEffect(() => { void load(''); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await api('/clients', { method: 'POST', body: JSON.stringify({ ...form, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined }) });
      setForm(emptyForm); await load('');
    } catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }

  async function deactivate(client: Client) {
    if (!window.confirm(`¿Desactivar a ${client.fullName}?`)) return;
    try { await api(`/clients/${client.id}`, { method: 'DELETE' }); await load(); }
    catch (err) { setError(errorMessage(err)); }
  }

  return <>
    <PageHeader eyebrow="CRM" title="Clientes" />
    {error && <Alert>{error}</Alert>}
    <section className="two-column">
      <form className="panel form-grid" onSubmit={submit}>
        <h3 className="full">Nuevo cliente</h3>
        <label>Nombre completo<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required minLength={2} /></label>
        <label>Documento<input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} required minLength={5} /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Teléfono<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label className="full">Dirección<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        <div className="full"><button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cliente'}</button></div>
      </form>
      <section className="panel">
        <div className="toolbar"><input placeholder="Buscar por nombre o documento" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void load()} /><button onClick={() => void load()}>Buscar</button></div>
        {rows.length === 0 ? <EmptyState>No hay clientes para mostrar.</EmptyState> : <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Documento</th><th>Contacto</th><th>Estado</th><th /></tr></thead><tbody>{rows.map((client) => <tr key={client.id}><td><strong>{client.fullName}</strong><small>{client.address || 'Sin dirección'}</small></td><td className="mono">{client.document}</td><td>{client.email || '—'}<small>{client.phone || 'Sin teléfono'}</small></td><td><span className={`badge ${client.active ? 'success' : 'neutral'}`}>{client.active ? 'Activo' : 'Inactivo'}</span></td><td>{client.active && <button className="danger-link" onClick={() => void deactivate(client)}>Desactivar</button>}</td></tr>)}</tbody></table></div>}
      </section>
    </section>
  </>;
}

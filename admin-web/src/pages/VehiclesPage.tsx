import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { Alert, EmptyState, PageHeader, errorMessage } from '../components/ui';
import type { Client, Vehicle } from '../types';

export function VehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ clientId: '', plate: '', make: '', model: '', year: new Date().getFullYear(), vin: '', color: '', mileage: 0, notes: '' });

  async function load() {
    try {
      const [vehicles, clientRows] = await Promise.all([api<Vehicle[]>('/vehicles'), api<Client[]>('/clients')]);
      const activeClients = clientRows.filter((client) => client.active);
      setRows(vehicles); setClients(activeClients); setForm((current) => current.clientId || !activeClients[0] ? current : { ...current, clientId: activeClients[0].id }); setError('');
    } catch (err) { setError(errorMessage(err)); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    try {
      await api('/vehicles', { method: 'POST', body: JSON.stringify({ ...form, plate: form.plate.toUpperCase(), vin: form.vin || undefined, color: form.color || undefined, notes: form.notes || undefined, year: Number(form.year), mileage: Number(form.mileage) }) });
      setForm((current) => ({ ...current, plate: '', make: '', model: '', vin: '', color: '', mileage: 0, notes: '' })); await load();
    } catch (err) { setError(errorMessage(err)); }
  }

  return <>
    <PageHeader eyebrow="Parque automotor" title="Vehículos" />
    {error && <Alert>{error}</Alert>}
    <form className="panel form-grid" onSubmit={submit}>
      <h3 className="full">Registrar vehículo</h3>
      <label>Cliente<select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required><option value="">Seleccione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></label>
      <label>Placa<input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} minLength={3} required /></label>
      <label>Marca<input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required /></label>
      <label>Modelo<input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required /></label>
      <label>Año<input type="number" min="1950" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required /></label>
      <label>Kilometraje<input type="number" min="0" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} /></label>
      <label>VIN<input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} /></label>
      <label>Color<input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></label>
      <label className="full">Notas<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      <div className="full"><button className="primary">Guardar vehículo</button></div>
    </form>
    <section className="panel">{rows.length === 0 ? <EmptyState>No hay vehículos registrados.</EmptyState> : <div className="table-wrap"><table><thead><tr><th>Placa</th><th>Vehículo</th><th>Cliente</th><th>Kilometraje</th></tr></thead><tbody>{rows.map((vehicle) => <tr key={vehicle.id}><td className="mono"><strong>{vehicle.plate}</strong></td><td>{vehicle.make} {vehicle.model}<small>{vehicle.year} · {vehicle.color || 'Sin color'}</small></td><td>{vehicle.client?.fullName || '—'}</td><td>{vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString('es-EC')} km` : '—'}</td></tr>)}</tbody></table></div>}</section>
  </>;
}

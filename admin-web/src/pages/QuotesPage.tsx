import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { Alert, EmptyState, PageHeader, errorMessage, formatDate, money } from '../components/ui';
import { quoteStatusLabel, quoteTransitions } from '../domain/status';
import type { CatalogItem, Client, Quote, QuoteStatus, Vehicle } from '../types';

type DraftItem = { catalogItemId: string; quantity: number };

export function QuotesPage({ onWorkOrderCreated }: { onWorkOrderCreated: () => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]); const [clients, setClients] = useState<Client[]>([]); const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [catalog, setCatalog] = useState<CatalogItem[]>([]); const [error, setError] = useState('');
  const [clientId, setClientId] = useState(''); const [vehicleId, setVehicleId] = useState(''); const [discountPct, setDiscountPct] = useState(0); const [validityDays, setValidityDays] = useState(15); const [notes, setNotes] = useState(''); const [items, setItems] = useState<DraftItem[]>([{ catalogItemId: '', quantity: 1 }]);

  async function load() {
    try {
      const [quoteRows, clientRows, vehicleRows, catalogRows] = await Promise.all([api<Quote[]>('/quotes'), api<Client[]>('/clients'), api<Vehicle[]>('/vehicles'), api<CatalogItem[]>('/catalog')]);
      const activeClients = clientRows.filter((client) => client.active);
      setQuotes(quoteRows); setClients(activeClients); setVehicles(vehicleRows); setCatalog(catalogRows.filter((item) => item.active)); setClientId((current) => current || activeClients[0]?.id || ''); setError('');
    } catch (err) { setError(errorMessage(err)); }
  }
  useEffect(() => { void load(); }, []);
  const allowedVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.clientId === clientId), [vehicles, clientId]);
  useEffect(() => { if (!allowedVehicles.some((vehicle) => vehicle.id === vehicleId)) setVehicleId(allowedVehicles[0]?.id || ''); }, [allowedVehicles, vehicleId]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const cleanItems = items.filter((item) => item.catalogItemId && item.quantity > 0);
    if (!clientId || !vehicleId || cleanItems.length === 0) { setError('Selecciona cliente, vehículo y al menos un ítem.'); return; }
    try {
      await api('/quotes', { method: 'POST', body: JSON.stringify({ clientId, vehicleId, discountPct: Number(discountPct), validityDays: Number(validityDays), notes: notes || undefined, items: cleanItems }) });
      setItems([{ catalogItemId: '', quantity: 1 }]); setDiscountPct(0); setNotes(''); await load();
    } catch (err) { setError(errorMessage(err)); }
  }

  async function updateStatus(quote: Quote, status: QuoteStatus) {
    try { await api(`/quotes/${quote.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load(); }
    catch (err) { setError(errorMessage(err)); }
  }

  async function createWorkOrder(quote: Quote) {
    try { await api(`/work-orders/from-quote/${quote.id}`, { method: 'POST' }); onWorkOrderCreated(); }
    catch (err) { setError(errorMessage(err)); }
  }

  return <>
    <PageHeader eyebrow="Ventas y aprobación" title="Cotizaciones" />
    {error && <Alert>{error}</Alert>}
    <form className="panel form-grid" onSubmit={create}>
      <h3 className="full">Nueva cotización</h3>
      <label>Cliente<select value={clientId} onChange={(e) => setClientId(e.target.value)} required><option value="">Seleccione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></label>
      <label>Vehículo<select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required><option value="">Seleccione</option>{allowedVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.make} {vehicle.model}</option>)}</select></label>
      <label>Descuento %<input type="number" min="0" max="100" step="0.01" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} /></label>
      <label>Vigencia (días)<input type="number" min="1" max="90" value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} /></label>
      <label className="full">Notas<input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      <div className="full quote-lines"><div className="panel-title"><h4>Ítems</h4><button type="button" onClick={() => setItems((current) => [...current, { catalogItemId: '', quantity: 1 }])}>+ Agregar</button></div>{items.map((line, index) => {
        const selected = catalog.find((item) => item.id === line.catalogItemId);
        return <div className="quote-line" key={`${index}-${line.catalogItemId}`}><select value={line.catalogItemId} onChange={(e) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, catalogItemId: e.target.value } : item))}><option value="">Producto o servicio</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name} · {money(item.price)}</option>)}</select><input type="number" min={selected?.type === 'product' ? 1 : 0.01} step={selected?.type === 'product' ? 1 : 0.01} value={line.quantity} onChange={(e) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(e.target.value) } : item))} /><button type="button" className="danger-link" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Quitar</button></div>;
      })}</div>
      <div className="full"><button className="primary">Crear cotización</button></div>
    </form>
    <section className="panel">{quotes.length === 0 ? <EmptyState>No hay cotizaciones.</EmptyState> : <div className="table-wrap"><table><thead><tr><th>Número</th><th>Cliente / vehículo</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{quotes.map((quote) => <tr key={quote.id}><td className="mono">{quote.number}</td><td><strong>{quote.client?.fullName || '—'}</strong><small>{quote.vehicle?.plate || '—'} · vence {formatDate(quote.expiresAt)}</small></td><td><strong>{money(quote.total)}</strong><small>Desc. {Number(quote.discountPct)}%</small></td><td><span className={`badge ${quote.status === 'approved' ? 'success' : ['rejected', 'expired'].includes(quote.status) ? 'danger' : 'neutral'}`}>{quoteStatusLabel[quote.status]}</span></td><td><div className="actions">{quoteTransitions[quote.status].map((next) => <button key={next} onClick={() => void updateStatus(quote, next)}>{quoteStatusLabel[next]}</button>)}{quote.status === 'approved' && <button className="primary compact" onClick={() => void createWorkOrder(quote)}>Crear OT</button>}</div></td></tr>)}</tbody></table></div>}</section>
  </>;
}

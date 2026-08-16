import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { Alert, EmptyState, PageHeader, errorMessage, formatDateTime, money } from '../components/ui';
import type { CatalogItem, CatalogItemType, InventoryMovement, StockMovementReason } from '../types';

const reasons: { value: StockMovementReason; label: string }[] = [
  { value: 'purchase', label: 'Compra' }, { value: 'return', label: 'Devolución' }, { value: 'correction', label: 'Corrección' },
];

export function CatalogPage() {
  const [rows, setRows] = useState<CatalogItem[]>([]);
  const [error, setError] = useState('');
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementItem, setMovementItem] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState({ sku: '', name: '', type: 'product' as CatalogItemType, price: 0, cost: 0, stock: 0, minStock: 0, description: '' });
  const [stock, setStock] = useState({ itemId: '', quantity: 0, reason: 'purchase' as StockMovementReason, note: '' });

  async function load() { try { setRows(await api<CatalogItem[]>('/catalog')); setError(''); } catch (err) { setError(errorMessage(err)); } }
  useEffect(() => { void load(); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    try {
      await api('/catalog', { method: 'POST', body: JSON.stringify({ ...form, price: Number(form.price), cost: Number(form.cost), stock: form.type === 'product' ? Number(form.stock) : 0, minStock: form.type === 'product' ? Number(form.minStock) : 0, description: form.description || undefined }) });
      setForm({ sku: '', name: '', type: 'product', price: 0, cost: 0, stock: 0, minStock: 0, description: '' }); await load();
    } catch (err) { setError(errorMessage(err)); }
  }

  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!stock.itemId || stock.quantity === 0) { setError('Selecciona un producto e ingresa una cantidad distinta de cero.'); return; }
    try {
      await api(`/catalog/${stock.itemId}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity: Number(stock.quantity), reason: stock.reason, note: stock.note || undefined }) });
      setStock((current) => ({ ...current, quantity: 0, note: '' })); await load();
    } catch (err) { setError(errorMessage(err)); }
  }

  async function showMovements(item: CatalogItem) {
    try { setMovementItem(item); setMovements(await api<InventoryMovement[]>(`/catalog/${item.id}/movements`)); }
    catch (err) { setError(errorMessage(err)); }
  }

  return <>
    <PageHeader eyebrow="Inventario y servicios" title="Catálogo" />
    {error && <Alert>{error}</Alert>}
    <section className="two-column">
      <form className="panel form-grid" onSubmit={create}>
        <h3 className="full">Nuevo ítem</h3>
        <label>SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required minLength={2} /></label>
        <label>Nombre<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} /></label>
        <label>Tipo<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CatalogItemType })}><option value="product">Producto</option><option value="service">Servicio</option></select></label>
        <label>Precio<input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required /></label>
        <label>Costo<input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></label>
        {form.type === 'product' && <><label>Stock inicial<input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></label><label>Stock mínimo<input type="number" min="0" step="1" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></label></>}
        <label className="full">Descripción<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <div className="full"><button className="primary">Crear ítem</button></div>
      </form>
      <form className="panel form-grid" onSubmit={adjust}>
        <h3 className="full">Movimiento de stock</h3>
        <label className="full">Producto<select value={stock.itemId} onChange={(e) => setStock({ ...stock, itemId: e.target.value })}><option value="">Seleccione</option>{rows.filter((item) => item.type === 'product' && item.active).map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name} · stock {item.stock}</option>)}</select></label>
        <label>Cantidad<input type="number" step="1" value={stock.quantity} onChange={(e) => setStock({ ...stock, quantity: Number(e.target.value) })} /><small>Usa valores negativos para salidas/correcciones.</small></label>
        <label>Motivo<select value={stock.reason} onChange={(e) => setStock({ ...stock, reason: e.target.value as StockMovementReason })}>{reasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</select></label>
        <label className="full">Nota<input value={stock.note} onChange={(e) => setStock({ ...stock, note: e.target.value })} /></label>
        <div className="full"><button>Ajustar inventario</button></div>
      </form>
    </section>
    <section className="panel">{rows.length === 0 ? <EmptyState>No hay productos o servicios.</EmptyState> : <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Ítem</th><th>Tipo</th><th>Precio</th><th>Stock</th><th /></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td className="mono">{item.sku}</td><td><strong>{item.name}</strong><small>{item.description || 'Sin descripción'}</small></td><td><span className="badge neutral">{item.type === 'product' ? 'Producto' : 'Servicio'}</span></td><td>{money(item.price)}</td><td>{item.type === 'product' ? <span className={item.stock <= item.minStock ? 'danger-text' : ''}>{item.stock} / min {item.minStock}</span> : '—'}</td><td>{item.type === 'product' && <button onClick={() => void showMovements(item)}>Movimientos</button>}</td></tr>)}</tbody></table></div>}</section>
    {movementItem && <section className="panel"><div className="panel-title"><div><p className="eyebrow">Historial</p><h3>{movementItem.sku} · {movementItem.name}</h3></div><button onClick={() => setMovementItem(null)}>Cerrar</button></div>{movements.length === 0 ? <EmptyState>Sin movimientos.</EmptyState> : <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Motivo</th><th>Cambio</th><th>Stock</th><th>Nota</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td>{formatDateTime(movement.createdAt)}</td><td>{movement.reason}</td><td className={movement.quantityChange < 0 ? 'danger-text' : 'success-text'}>{movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}</td><td>{movement.stockBefore} → {movement.stockAfter}</td><td>{movement.note || '—'}</td></tr>)}</tbody></table></div>}</section>}
  </>;
}

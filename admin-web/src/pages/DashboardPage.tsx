import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Alert, Loading, PageHeader, errorMessage, money } from '../components/ui';
import type { CatalogItem, Client, Quote, Vehicle, WorkOrder } from '../types';

interface Metrics { clients: number; vehicles: number; quotes: number; openOrders: number; quoteValue: number; lowStock: CatalogItem[] }

export function DashboardPage({ refreshKey }: { refreshKey: number }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api<Client[]>('/clients'), api<Vehicle[]>('/vehicles'), api<Quote[]>('/quotes'), api<WorkOrder[]>('/work-orders'),
      api<CatalogItem[]>('/catalog/alerts/low-stock').catch(() => []),
    ]).then(([clients, vehicles, quotes, orders, lowStock]) => {
      if (!active) return;
      setMetrics({
        clients: clients.filter((client) => client.active).length,
        vehicles: vehicles.length,
        quotes: quotes.length,
        openOrders: orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length,
        quoteValue: quotes.filter((quote) => quote.status === 'approved').reduce((sum, quote) => sum + Number(quote.total || 0), 0),
        lowStock,
      });
      setError('');
    }).catch((err) => active && setError(errorMessage(err)));
    return () => { active = false; };
  }, [refreshKey]);

  return <>
    <PageHeader eyebrow="Resumen operativo" title="Dashboard" />
    {error && <Alert>{error}</Alert>}
    {!metrics ? <Loading label="Cargando indicadores…" /> : <>
      <div className="metric-grid">
        <Metric label="Clientes activos" value={String(metrics.clients)} />
        <Metric label="Vehículos" value={String(metrics.vehicles)} />
        <Metric label="Órdenes abiertas" value={String(metrics.openOrders)} />
        <Metric label="Cotizaciones aprobadas" value={money(metrics.quoteValue)} />
      </div>
      <section className="panel"><div className="panel-title"><div><p className="eyebrow">Inventario</p><h3>Stock bajo</h3></div><span className="badge warning">{metrics.lowStock.length}</span></div>
        {metrics.lowStock.length === 0 ? <p className="muted">No hay productos por debajo del stock mínimo.</p> : <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead><tbody>{metrics.lowStock.map((item) => <tr key={item.id}><td className="mono">{item.sku}</td><td>{item.name}</td><td><strong className="danger-text">{item.stock}</strong></td><td>{item.minStock}</td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </>;
}

function Metric({ label, value }: { label: string; value: string }) { return <article className="metric"><span>{label}</span><strong>{value}</strong></article>; }

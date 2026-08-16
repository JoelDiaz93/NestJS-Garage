import { useEffect, useState } from 'react';
import { api } from '../api';
import type { CatalogItem, Client, Quote, Vehicle, WorkOrder } from '../types';

interface Metrics { clients: number; vehicles: number; quotes: number; openOrders: number; lowStock: CatalogItem[]; }

export function Dashboard({ refreshKey }: { refreshKey: number }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Client[]>('/clients'), api<Vehicle[]>('/vehicles'), api<Quote[]>('/quotes'), api<WorkOrder[]>('/work-orders'),
      api<CatalogItem[]>('/catalog/alerts/low-stock').catch(() => []),
    ]).then(([clients, vehicles, quotes, orders, lowStock]) => {
      setMetrics({
        clients: clients.filter((x) => x.active).length,
        vehicles: vehicles.length,
        quotes: quotes.length,
        openOrders: orders.filter((x) => !['delivered', 'cancelled'].includes(x.status)).length,
        lowStock,
      });
    }).catch((err) => setError(err instanceof Error ? err.message : 'Error cargando dashboard'));
  }, [refreshKey]);

  if (error) return <div className="alert error">{error}</div>;
  if (!metrics) return <div className="panel">Cargando indicadores…</div>;

  return <>
    <section className="section-heading"><div><p className="eyebrow">Resumen operativo</p><h2>Dashboard</h2></div></section>
    <div className="metric-grid">
      <Metric label="Clientes activos" value={metrics.clients} />
      <Metric label="Vehículos" value={metrics.vehicles} />
      <Metric label="Cotizaciones" value={metrics.quotes} />
      <Metric label="Órdenes abiertas" value={metrics.openOrders} />
    </div>
    <section className="panel">
      <div className="panel-title"><h3>Alertas de inventario</h3><span className="badge warning">{metrics.lowStock.length}</span></div>
      {metrics.lowStock.length === 0 ? <p className="muted">No hay productos por debajo del stock mínimo.</p> :
        <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead><tbody>
          {metrics.lowStock.map((item) => <tr key={item.id}><td className="mono">{item.sku}</td><td>{item.name}</td><td>{item.stock}</td><td>{item.minStock}</td></tr>)}
        </tbody></table></div>}
    </section>
  </>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

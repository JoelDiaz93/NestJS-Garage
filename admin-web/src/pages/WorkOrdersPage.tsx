import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { api, apiBlob } from '../api/client';
import { Alert, EmptyState, PageHeader, errorMessage, formatDateTime, money } from '../components/ui';
import { allowedWorkOrderTransitions, workOrderStatusLabel } from '../domain/status';
import type { Evidence, Session, User, WorkOrder, WorkOrderStatus } from '../types';

export function WorkOrdersPage({ session, refreshKey }: { session: Session; refreshKey: number }) {
  const [rows, setRows] = useState<WorkOrder[]>([]); const [technicians, setTechnicians] = useState<User[]>([]); const [error, setError] = useState(''); const [evidenceByOrder, setEvidenceByOrder] = useState<Record<string, Evidence[]>>({});
  const canAssign = session.user.roles.includes('admin') || session.user.roles.includes('advisor');

  async function load() {
    try {
      const orderRows = await api<WorkOrder[]>('/work-orders');
      setRows(orderRows);
      if (canAssign) setTechnicians(await api<User[]>('/users/assignable-technicians').catch(() => []));
      setError('');
    } catch (err) { setError(errorMessage(err)); }
  }
  useEffect(() => { void load(); }, [refreshKey]);

  const visibleRows = useMemo(() => {
    const technicianOnly = session.user.roles.includes('technician') && !session.user.roles.includes('admin') && !session.user.roles.includes('advisor');
    return technicianOnly ? rows.filter((order) => order.technicianId === session.user.id) : rows;
  }, [rows, session]);

  async function update(order: WorkOrder, patch: Record<string, unknown>) {
    try { await api(`/work-orders/${order.id}`, { method: 'PATCH', body: JSON.stringify(patch) }); await load(); }
    catch (err) { setError(errorMessage(err)); }
  }

  async function consume(order: WorkOrder) {
    if (!window.confirm(`¿Registrar el consumo de materiales de ${order.number}? Esta acción descuenta inventario.`)) return;
    try { await api(`/work-orders/${order.id}/consume-materials`, { method: 'POST' }); await load(); }
    catch (err) { setError(errorMessage(err)); }
  }

  async function uploadEvidence(order: WorkOrder, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const data = new FormData(); data.append('file', file);
    try { await api(`/media/work-orders/${order.id}/evidence`, { method: 'POST', body: data }); event.target.value = ''; await loadEvidence(order.id); }
    catch (err) { setError(errorMessage(err)); }
  }

  async function loadEvidence(orderId: string) {
    try { setEvidenceByOrder((current) => ({ ...current, [orderId]: await api<Evidence[]>(`/media/work-orders/${orderId}/evidence`) })); }
    catch (err) { setError(errorMessage(err)); }
  }

  async function openEvidence(evidence: Evidence) {
    try {
      const blob = await apiBlob(`/media/evidence/${encodeURIComponent(evidence.filename)}`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) { setError(errorMessage(err)); }
  }

  return <>
    <PageHeader eyebrow="Ejecución del taller" title="Órdenes de trabajo" action={<span className="live-indicator"><span className="dot online" />Tiempo real</span>} />
    {error && <Alert>{error}</Alert>}
    {visibleRows.length === 0 ? <EmptyState>No hay órdenes disponibles para este usuario.</EmptyState> : <section className="order-grid-list">{visibleRows.map((order) => {
      const nextStatuses = allowedWorkOrderTransitions(order.status, session.user.roles);
      const evidence = evidenceByOrder[order.id];
      return <article className="order-card" key={order.id}>
        <header><div><span className="mono">{order.number}</span><h3>{order.vehicle?.plate || '—'} · {order.vehicle?.make || ''} {order.vehicle?.model || ''}</h3><p>{order.client?.fullName || 'Cliente sin nombre'}</p></div><span className={`badge ${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'neutral'}`}>{workOrderStatusLabel[order.status]}</span></header>
        <div className="order-fields">
          <label>Estado<select value="" disabled={nextStatuses.length === 0} onChange={(e) => { if (e.target.value) void update(order, { status: e.target.value as WorkOrderStatus }); }}><option value="">{nextStatuses.length ? 'Cambiar estado…' : 'Estado final'}</option>{nextStatuses.map((status) => <option key={status} value={status}>{workOrderStatusLabel[status]}</option>)}</select></label>
          {canAssign && <label>Técnico<select value={order.technicianId || ''} onChange={(e) => { if (e.target.value) void update(order, { technicianId: e.target.value }); }}><option value="">Sin asignar</option>{technicians.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>}
          <label className="full">Diagnóstico<textarea defaultValue={order.diagnosis || ''} placeholder="Registrar diagnóstico…" onBlur={(e) => { if (e.target.value !== (order.diagnosis || '')) void update(order, { diagnosis: e.target.value }); }} /></label>
          <label className="full">Notas<textarea defaultValue={order.notes || ''} placeholder="Notas internas…" onBlur={(e) => { if (e.target.value !== (order.notes || '')) void update(order, { notes: e.target.value }); }} /></label>
        </div>
        <div className="order-actions"><label className="file-button">Subir evidencia<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void uploadEvidence(order, e)} /></label><button onClick={() => void loadEvidence(order.id)}>Ver evidencias</button>{['in_progress', 'ready'].includes(order.status) && <button className="primary" disabled={Boolean(order.stockConsumedAt)} onClick={() => void consume(order)}>{order.stockConsumedAt ? 'Materiales consumidos' : 'Consumir materiales'}</button>}</div>
        {evidence && <div className="evidence-list">{evidence.length === 0 ? <small>No hay evidencias.</small> : evidence.map((item) => <button key={item.id} onClick={() => void openEvidence(item)}>{item.originalName}<small>{Math.ceil(item.size / 1024)} KB · {formatDateTime(item.createdAt)}</small></button>)}</div>}
        <footer><span>Estimado <strong>{money(order.estimatedTotal)}</strong>{order.actualTotal !== undefined && <> · Real <strong>{money(order.actualTotal)}</strong></>}</span><small>Actualizado {formatDateTime(order.updatedAt)}</small></footer>
      </article>;
    })}</section>}
  </>;
}

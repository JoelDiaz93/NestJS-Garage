import { ChangeEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { User, WorkOrder, WorkOrderStatus } from '../types';

const statuses:WorkOrderStatus[]=['received','diagnosis','waiting_approval','in_progress','ready','delivered','cancelled'];
export function WorkOrders({refreshKey}:{refreshKey:number}){
  const [rows,setRows]=useState<WorkOrder[]>([]),[users,setUsers]=useState<User[]>([]),[error,setError]=useState('');
  async function load(){try{setRows(await api<WorkOrder[]>('/work-orders'));try{setUsers(await api<User[]>('/users'));}catch{setUsers([]);}}catch(e){setError(msg(e));}}
  useEffect(()=>{void load();},[refreshKey]);
  async function update(id:string,patch:Record<string,unknown>){try{await api(`/work-orders/${id}`,{method:'PATCH',body:JSON.stringify(patch)});await load();}catch(e){setError(msg(e));}}
  async function consume(order:WorkOrder){try{await api(`/work-orders/${order.id}/consume-materials`,{method:'POST'});await load();}catch(e){setError(msg(e));}}
  async function evidence(order:WorkOrder,event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];if(!file)return;const data=new FormData();data.append('file',file);try{await api(`/media/work-orders/${order.id}/evidence`,{method:'POST',body:data});event.target.value='';}catch(e){setError(msg(e));}}
  const techs=users.filter(u=>u.roles.includes('technician')||u.roles.includes('admin'));
  return <><section className="section-heading"><div><p className="eyebrow">Ejecución del taller</p><h2>Órdenes de trabajo</h2></div><span className="live-dot">Live</span></section>{error&&<div className="alert error">{error}</div>}
  <section className="cards">{rows.map(o=><article className="order-card" key={o.id}><div className="order-top"><div><span className="mono">{o.number}</span><h3>{o.vehicle?.plate} · {o.vehicle?.make} {o.vehicle?.model}</h3><p>{o.client?.fullName}</p></div><span className="badge neutral">{o.status}</span></div><div className="order-grid"><label>Estado<select value={o.status} onChange={e=>update(o.id,{status:e.target.value})}>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>{techs.length>0&&<label>Técnico<select value={o.technicianId??''} onChange={e=>update(o.id,{technicianId:e.target.value})}><option value="">Sin asignar</option>{techs.map(t=><option key={t.id} value={t.id}>{t.fullName}</option>)}</select></label>}<label>Diagnóstico<textarea defaultValue={o.diagnosis??''} onBlur={e=>e.target.value!==o.diagnosis&&update(o.id,{diagnosis:e.target.value})}/></label><label>Evidencia<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>evidence(o,e)}/></label></div>{['in_progress','ready'].includes(o.status)&&<div className="materials-row"><button className="primary compact" disabled={Boolean(o.stockConsumedAt)} onClick={()=>consume(o)}>{o.stockConsumedAt?'Materiales consumidos':'Consumir materiales'}</button></div>}<footer><span>Estimado: <strong>${Number(o.estimatedTotal).toFixed(2)}</strong></span><small>Actualizado {new Date(o.updatedAt).toLocaleString()}</small></footer></article>)}</section></>;
}
const msg=(e:unknown)=>e instanceof Error?e.message:'Error inesperado';

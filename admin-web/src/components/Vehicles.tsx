import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { Client, Vehicle } from '../types';

export function Vehicles() {
  const [rows, setRows] = useState<Vehicle[]>([]); const [clients, setClients] = useState<Client[]>([]); const [error,setError]=useState('');
  const [form,setForm]=useState({clientId:'',plate:'',make:'',model:'',year:new Date().getFullYear(),color:'',mileage:0});
  async function load(){try{const [v,c]=await Promise.all([api<Vehicle[]>('/vehicles'),api<Client[]>('/clients')]);setRows(v);setClients(c.filter(x=>x.active));if(!form.clientId&&c[0])setForm(f=>({...f,clientId:c[0].id}));}catch(e){setError(message(e));}}
  useEffect(()=>{void load();},[]);
  async function submit(e:FormEvent){e.preventDefault();setError('');try{await api('/vehicles',{method:'POST',body:JSON.stringify({...form,color:form.color||undefined,mileage:Number(form.mileage)})});setForm(f=>({...f,plate:'',make:'',model:'',color:'',mileage:0}));await load();}catch(err){setError(message(err));}}
  return <><section className="section-heading"><div><p className="eyebrow">Parque automotor</p><h2>Vehículos</h2></div></section>{error&&<div className="alert error">{error}</div>}
  <form className="panel form-grid" onSubmit={submit}><h3 className="full">Registrar vehículo</h3>
    <label>Cliente<select value={form.clientId} onChange={e=>setForm({...form,clientId:e.target.value})} required><option value="">Seleccione</option>{clients.map(c=><option key={c.id} value={c.id}>{c.fullName}</option>)}</select></label>
    <label>Placa<input value={form.plate} onChange={e=>setForm({...form,plate:e.target.value})} required /></label>
    <label>Marca<input value={form.make} onChange={e=>setForm({...form,make:e.target.value})} required /></label>
    <label>Modelo<input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} required /></label>
    <label>Año<input type="number" value={form.year} onChange={e=>setForm({...form,year:Number(e.target.value)})} required /></label>
    <label>Color<input value={form.color} onChange={e=>setForm({...form,color:e.target.value})} /></label>
    <label>Kilometraje<input type="number" min="0" value={form.mileage} onChange={e=>setForm({...form,mileage:Number(e.target.value)})} /></label>
    <div className="full"><button className="primary">Guardar vehículo</button></div>
  </form>
  <section className="panel"><div className="table-wrap"><table><thead><tr><th>Placa</th><th>Vehículo</th><th>Cliente</th><th>Kilometraje</th></tr></thead><tbody>{rows.map(v=><tr key={v.id}><td className="mono">{v.plate}</td><td><strong>{v.make} {v.model}</strong><small>{v.year} · {v.color??'Sin color'}</small></td><td>{v.client?.fullName??v.clientId}</td><td>{v.mileage?.toLocaleString()??'—'}</td></tr>)}</tbody></table></div></section></>;
}
const message=(e:unknown)=>e instanceof Error?e.message:'Error inesperado';

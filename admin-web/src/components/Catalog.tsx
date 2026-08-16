import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { CatalogItem } from '../types';

export function Catalog() {
  const [rows,setRows]=useState<CatalogItem[]>([]); const [error,setError]=useState(''); const [stockId,setStockId]=useState(''); const [stockQty,setStockQty]=useState(0);
  const [form,setForm]=useState({sku:'',name:'',type:'product',price:0,cost:0,stock:0,minStock:0,description:''});
  const load=()=>api<CatalogItem[]>('/catalog').then(setRows).catch(e=>setError(msg(e)));
  useEffect(()=>{void load();},[]);
  async function create(e:FormEvent){e.preventDefault();setError('');try{await api('/catalog',{method:'POST',body:JSON.stringify({...form,price:Number(form.price),cost:Number(form.cost),stock:Number(form.stock),minStock:Number(form.minStock),description:form.description||undefined})});setForm({...form,sku:'',name:'',price:0,cost:0,stock:0,minStock:0,description:''});await load();}catch(err){setError(msg(err));}}
  async function adjust(e:FormEvent){e.preventDefault();if(!stockId)return;setError('');try{await api(`/catalog/${stockId}/stock`,{method:'PATCH',body:JSON.stringify({quantity:Number(stockQty),reason:'correction',note:'Ajuste desde panel administrativo'})});setStockQty(0);await load();}catch(err){setError(msg(err));}}
  return <><section className="section-heading"><div><p className="eyebrow">Inventario y servicios</p><h2>Catálogo</h2></div></section>{error&&<div className="alert error">{error}</div>}
  <form className="panel form-grid" onSubmit={create}><h3 className="full">Nuevo ítem</h3>
    <label>SKU<input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} required /></label><label>Nombre<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></label>
    <label>Tipo<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="product">Producto</option><option value="service">Servicio</option></select></label>
    <label>Precio<input type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} /></label><label>Costo<input type="number" min="0" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:Number(e.target.value)})} /></label>
    {form.type==='product'&&<><label>Stock inicial<input type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})} /></label><label>Stock mínimo<input type="number" min="0" value={form.minStock} onChange={e=>setForm({...form,minStock:Number(e.target.value)})} /></label></>}
    <label className="span-2">Descripción<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></label><div className="full"><button className="primary">Crear ítem</button></div>
  </form>
  <form className="panel inline-form" onSubmit={adjust}><h3>Ajuste de stock</h3><select value={stockId} onChange={e=>setStockId(e.target.value)}><option value="">Producto</option>{rows.filter(x=>x.type==='product').map(x=><option key={x.id} value={x.id}>{x.sku} · {x.name}</option>)}</select><input type="number" value={stockQty} onChange={e=>setStockQty(Number(e.target.value))}/><button>Ajustar</button></form>
  <section className="panel"><div className="table-wrap"><table><thead><tr><th>SKU</th><th>Ítem</th><th>Tipo</th><th>Precio</th><th>Stock</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td className="mono">{x.sku}</td><td>{x.name}</td><td><span className="badge neutral">{x.type}</span></td><td>${Number(x.price).toFixed(2)}</td><td>{x.type==='product'?<span className={x.stock<=x.minStock?'stock-low':''}>{x.stock} / min {x.minStock}</span>:'—'}</td></tr>)}</tbody></table></div></section></>;
}
const msg=(e:unknown)=>e instanceof Error?e.message:'Error inesperado';

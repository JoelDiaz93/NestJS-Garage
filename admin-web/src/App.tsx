import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getSession, logout, storeSession, wsUrl } from './api';
import { Catalog } from './components/Catalog';
import { Clients } from './components/Clients';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Quotes } from './components/Quotes';
import { Vehicles } from './components/Vehicles';
import { Users } from './components/Users';
import { WorkOrders } from './components/WorkOrders';
import type { Session } from './types';

type Section='dashboard'|'clients'|'vehicles'|'catalog'|'quotes'|'orders'|'users';
const baseNav:[Section,string][]=[['dashboard','Dashboard'],['clients','Clientes'],['vehicles','Vehículos'],['catalog','Catálogo'],['quotes','Cotizaciones'],['orders','Órdenes']];

export default function App(){
  const [session,setSession]=useState<Session|null>(()=>getSession()); const [section,setSection]=useState<Section>('dashboard'); const [refreshKey,setRefreshKey]=useState(0);
  useEffect(()=>{if(!session)return;const socket=io(wsUrl,{auth:{token:session.accessToken}});socket.on('work-order.updated',()=>setRefreshKey(k=>k+1));return()=>{socket.disconnect();};},[session]);
  if(!session)return <Login onLogin={setSession}/>;
  async function signOut(){await logout();storeSession(null);setSession(null);}
  const nav = session.user.roles.includes('admin') ? [...baseNav, ['users','Usuarios'] as [Section,string]] : baseNav;
  return <div className="app-shell"><aside><div className="brand"><div className="brand-mark">GF</div><div><strong>GarageFlow</strong><small>Workshop OS</small></div></div><nav>{nav.map(([id,label])=><button key={id} className={section===id?'active':''} onClick={()=>setSection(id)}>{label}</button>)}</nav><div className="user-card"><strong>{session.user.fullName}</strong><small>{session.user.roles.join(' · ')}</small><button onClick={signOut}>Cerrar sesión</button></div></aside><main className="workspace">{section==='dashboard'&&<Dashboard refreshKey={refreshKey}/>} {section==='clients'&&<Clients/>}{section==='vehicles'&&<Vehicles/>}{section==='catalog'&&<Catalog/>}{section==='quotes'&&<Quotes/>}{section==='orders'&&<WorkOrders refreshKey={refreshKey}/>} {section==='users'&&<Users currentUserId={session.user.id}/>}</main></div>;
}

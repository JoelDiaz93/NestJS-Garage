import type { ReactNode } from 'react';
import type { Session, UserRole } from '../types';

type Section = 'dashboard' | 'clients' | 'vehicles' | 'catalog' | 'quotes' | 'orders' | 'users';
export type { Section };

const items: { id: Section; label: string; roles?: UserRole[]; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'clients', label: 'Clientes', roles: ['admin', 'advisor'], icon: '◉' },
  { id: 'vehicles', label: 'Vehículos', roles: ['admin', 'advisor'], icon: '◆' },
  { id: 'catalog', label: 'Catálogo', roles: ['admin', 'advisor'], icon: '▤' },
  { id: 'quotes', label: 'Cotizaciones', roles: ['admin', 'advisor'], icon: '◇' },
  { id: 'orders', label: 'Órdenes', icon: '✓' },
  { id: 'users', label: 'Usuarios', roles: ['admin'], icon: '⚙' },
];

export function AppShell({ session, section, setSection, onLogout, apiOnline, children }: {
  session: Session;
  section: Section;
  setSection: (section: Section) => void;
  onLogout: () => void;
  apiOnline: boolean | null;
  children: ReactNode;
}) {
  const visible = items.filter((item) => !item.roles || item.roles.some((role) => session.user.roles.includes(role)));
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="logo-mark">GF</span><div><strong>GarageFlow</strong><small>Workshop Management</small></div></div>
      <nav className="nav-list" aria-label="Navegación principal">
        {visible.map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}><span>{item.icon}</span>{item.label}</button>)}
      </nav>
      <div className="sidebar-footer">
        <div className="api-status"><span className={apiOnline === true ? 'dot online' : apiOnline === false ? 'dot offline' : 'dot'} />API {apiOnline === true ? 'conectada' : apiOnline === false ? 'sin conexión' : 'verificando'}</div>
        <div className="user-card"><strong>{session.user.fullName}</strong><small>{session.user.email}</small><span>{session.user.roles.join(' · ')}</span><button onClick={onLogout}>Cerrar sesión</button></div>
      </div>
    </aside>
    <main className="workspace">{children}</main>
  </div>;
}

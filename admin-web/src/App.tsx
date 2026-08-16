import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { healthCheck, logout } from './api/client';
import { readSession, writeSession } from './auth/session';
import { AppShell, type Section } from './components/AppShell';
import { config } from './config';
import { CatalogPage } from './pages/CatalogPage';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { QuotesPage } from './pages/QuotesPage';
import { UsersPage } from './pages/UsersPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import type { Session } from './types';

export default function App() {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [section, setSection] = useState<Section>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const listener = (event: Event) => setSession((event as CustomEvent<Session | null>).detail);
    window.addEventListener('garageflow:session', listener);
    return () => window.removeEventListener('garageflow:session', listener);
  }, []);

  useEffect(() => {
    void healthCheck().then(setApiOnline);
    const interval = window.setInterval(() => void healthCheck().then(setApiOnline), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!session) return;
    const socket = io(config.wsUrl, { auth: { token: session.accessToken }, transports: ['websocket', 'polling'] });
    socket.on('connect', () => setApiOnline(true));
    socket.on('work-order.updated', () => setRefreshKey((current) => current + 1));
    return () => socket.disconnect();
  }, [session?.accessToken]);

  if (!session) return <LoginPage onLogin={(next) => { writeSession(next); setSession(next); }} />;

  async function signOut() { await logout(); setSession(null); setSection('dashboard'); }
  function showOrders() { setRefreshKey((current) => current + 1); setSection('orders'); }

  return <AppShell session={session} section={section} setSection={setSection} onLogout={() => void signOut()} apiOnline={apiOnline}>
    {section === 'dashboard' && <DashboardPage refreshKey={refreshKey} />}
    {section === 'clients' && <ClientsPage />}
    {section === 'vehicles' && <VehiclesPage />}
    {section === 'catalog' && <CatalogPage />}
    {section === 'quotes' && <QuotesPage onWorkOrderCreated={showOrders} />}
    {section === 'orders' && <WorkOrdersPage session={session} refreshKey={refreshKey} />}
    {section === 'users' && session.user.roles.includes('admin') && <UsersPage currentUserId={session.user.id} />}
  </AppShell>;
}

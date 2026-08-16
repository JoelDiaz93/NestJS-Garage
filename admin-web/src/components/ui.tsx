import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</header>;
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  return <div className={`alert ${tone}`} role="alert">{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return <div className="loading"><span className="spinner" />{label}</div>;
}

export function money(value: number | string | undefined): string {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number.isFinite(number) ? number : 0);
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-EC');
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('es-EC');
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado';
}

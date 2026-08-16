import type { QuoteStatus, UserRole, WorkOrderStatus } from '../types';

export const quoteTransitions: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['sent', 'approved', 'rejected'],
  sent: ['approved', 'rejected', 'expired'],
  approved: [],
  rejected: [],
  expired: [],
};

export const workOrderTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  received: ['diagnosis', 'cancelled'],
  diagnosis: ['waiting_approval', 'in_progress', 'cancelled'],
  waiting_approval: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['delivered', 'in_progress'],
  delivered: [],
  cancelled: [],
};

export function allowedWorkOrderTransitions(status: WorkOrderStatus, roles: UserRole[]): WorkOrderStatus[] {
  const values = workOrderTransitions[status];
  const technicianOnly = roles.includes('technician') && !roles.includes('admin') && !roles.includes('advisor');
  return technicianOnly ? values.filter((value) => !['delivered', 'cancelled'].includes(value)) : values;
}

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada', expired: 'Expirada',
};

export const workOrderStatusLabel: Record<WorkOrderStatus, string> = {
  received: 'Recibido', diagnosis: 'Diagnóstico', waiting_approval: 'Esperando aprobación', in_progress: 'En proceso', ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
};

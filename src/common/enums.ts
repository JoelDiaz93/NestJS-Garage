export enum UserRole {
  ADMIN = 'admin',
  ADVISOR = 'advisor',
  TECHNICIAN = 'technician',
}

export enum CatalogItemType {
  PRODUCT = 'product',
  SERVICE = 'service',
}

export enum StockMovementReason {
  PURCHASE = 'purchase',
  RETURN = 'return',
  CORRECTION = 'correction',
  WORK_ORDER = 'work_order',
  INITIAL = 'initial',
}

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum WorkOrderStatus {
  RECEIVED = 'received',
  DIAGNOSIS = 'diagnosis',
  WAITING_APPROVAL = 'waiting_approval',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

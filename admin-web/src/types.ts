export type UserRole = 'admin' | 'advisor' | 'technician';
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
export type WorkOrderStatus =
  | 'received'
  | 'diagnosis'
  | 'waiting_approval'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled';
export type CatalogItemType = 'product' | 'service';
export type StockMovementReason = 'purchase' | 'return' | 'correction' | 'work_order' | 'initial';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  isActive: boolean;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface Client {
  id: string;
  fullName: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  mileage?: number;
  notes?: string;
  clientId: string;
  client?: Client;
}

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  type: CatalogItemType;
  price: number | string;
  cost: number | string;
  stock: number;
  minStock: number;
  active: boolean;
  description?: string;
}

export interface InventoryMovement {
  id: string;
  catalogItemId: string;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  reason: StockMovementReason;
  note?: string;
  performedByUserId?: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  catalogItemId: string;
  sku: string;
  description: string;
  type: CatalogItemType;
  unitPrice: number | string;
  quantity: number | string;
  lineTotal: number | string;
}

export interface Quote {
  id: string;
  number: string;
  status: QuoteStatus;
  clientId: string;
  vehicleId: string;
  client: Client;
  vehicle: Vehicle;
  items: QuoteItem[];
  subtotal: number | string;
  discountPct: number | string;
  discountAmount: number | string;
  tax: number | string;
  total: number | string;
  notes?: string;
  expiresAt: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  number: string;
  status: WorkOrderStatus;
  clientId: string;
  vehicleId: string;
  quoteId?: string;
  technicianId?: string;
  technician?: User;
  client: Client;
  vehicle: Vehicle;
  diagnosis?: string;
  notes?: string;
  estimatedTotal: number | string;
  actualTotal?: number | string;
  stockConsumedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  workOrderId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedByUserId?: string;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface Supplier {
  _id: string;
  name: string;
  contactEmail?: string;
  phone?: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  supplier: string;
  unitCost: number;
  reorderThreshold: number;
  quantityInStock: number;
  createdAt: string;
}

export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderLine {
  product: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface PurchaseOrder {
  _id: string;
  orderNumber: number;
  supplier: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  totalCost: number;
  orderedAt?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  path: string;
  fieldErrors?: { field: string; message: string }[];
}

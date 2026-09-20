import { Schema, model, Types, Document } from 'mongoose';

export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderLine {
  product: Types.ObjectId;
  quantityOrdered: number;
  unitCost: number;
}

export interface PurchaseOrderDocument extends Document {
  orderNumber: number;
  supplier: Types.ObjectId;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  totalCost: number;
  createdBy: Types.ObjectId;
  orderedAt?: Date;
  receivedAt?: Date;
  createdAt: Date;
}

const lineSchema = new Schema<PurchaseOrderLine>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantityOrdered: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const purchaseOrderSchema = new Schema<PurchaseOrderDocument>({
  orderNumber: { type: Number, required: true, unique: true },
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  status: { type: String, enum: ['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'], default: 'DRAFT', index: true },
  lines: { type: [lineSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
  totalCost: { type: Number, required: true, min: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderedAt: { type: Date },
  receivedAt: { type: Date },
  createdAt: { type: Date, default: () => new Date() },
});

export const PurchaseOrder = model<PurchaseOrderDocument>('PurchaseOrder', purchaseOrderSchema);

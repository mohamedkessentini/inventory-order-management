import { Schema, model, Types, Document } from 'mongoose';

export interface ProductDocument extends Document {
  sku: string;
  name: string;
  supplier: Types.ObjectId;
  unitCost: number;
  reorderThreshold: number;
  quantityInStock: number;
  createdAt: Date;
}

const productSchema = new Schema<ProductDocument>({
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  unitCost: { type: Number, required: true, min: 0 },
  reorderThreshold: { type: Number, required: true, min: 0, default: 10 },
  quantityInStock: { type: Number, required: true, min: 0, default: 0 },
  createdAt: { type: Date, default: () => new Date() },
});

productSchema.index({ name: 'text', sku: 'text' });

export const Product = model<ProductDocument>('Product', productSchema);

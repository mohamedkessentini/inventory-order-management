import { Schema, model, Document } from 'mongoose';

export interface SupplierDocument extends Document {
  name: string;
  contactEmail?: string;
  phone?: string;
  createdAt: Date;
}

const supplierSchema = new Schema<SupplierDocument>({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  contactEmail: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true, maxlength: 30 },
  createdAt: { type: Date, default: () => new Date() },
});

supplierSchema.index({ name: 'text' });

export const Supplier = model<SupplierDocument>('Supplier', supplierSchema);

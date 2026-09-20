import { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const userSchema = new Schema<UserDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

export const User = model<UserDocument>('User', userSchema);

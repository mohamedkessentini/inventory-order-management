import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  logger.info(`Connected to MongoDB at ${redactUri(env.mongoUri)}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

function redactUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`inventory-order-management API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});

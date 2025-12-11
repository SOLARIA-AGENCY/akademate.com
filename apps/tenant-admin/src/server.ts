// Environment variables loaded via Node.js --env-file flag (no dotenv needed)
import { getPayload } from 'payload';
import { getPayloadConfig } from './payload.config.js';

// Start Payload CMS
const start = async (): Promise<void> => {
  // Initialize Payload - config is evaluated here (lazy) after env vars are loaded
  const payload = await getPayload({
    config: getPayloadConfig(),
  });

  payload.logger.info(`✓ Payload initialized`);
  payload.logger.info(`✓ Admin URL: ${payload.getAdminURL()}`);
  payload.logger.info(`✓ API URL: ${payload.getAdminURL().replace('/admin', '/api')}`);

  // Payload 3.x with Next.js: Server runs internally
  // Keep process alive to serve requests
  payload.logger.info(`✓ Server running (Next.js internal)`);

  // Keep process alive
  process.on('SIGTERM', () => {
    payload.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    payload.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
};

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

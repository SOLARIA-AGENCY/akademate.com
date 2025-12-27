/**
 * Payload CMS Configuration for Campus App
 *
 * This configuration reuses the collections from tenant-admin
 * to access enrollment and attendance data.
 */

import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.POSTGRES_URL,
    },
  }),
  collections: [
    // We'll import minimal collections needed for QR check-in
    // For now, we'll use a simplified approach
  ],
  typescript: {
    outputFile: './payload-types.ts',
  },
})

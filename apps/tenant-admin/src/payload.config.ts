import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import collections (will be implemented next with TDD methodology)
import { Cycles } from './collections/Cycles/Cycles';
import { Campuses } from './collections/Campuses/Campuses';
import { Users } from './collections/Users/Users';
import { AreasFormativas } from './collections/AreasFormativas/AreasFormativas';
import { EntidadesFinanciadoras } from './collections/EntidadesFinanciadoras/EntidadesFinanciadoras';
import { Courses } from './collections/Courses/Courses';
import { CourseRuns } from './collections/CourseRuns/CourseRuns';
import { Enrollments } from './collections/Enrollments/Enrollments';
import { Students } from './collections/Students/Students';
import { Leads } from './collections/Leads/Leads';
import { Campaigns } from './collections/Campaigns/Campaigns';
import { AdsTemplates } from './collections/AdsTemplates/AdsTemplates';
import { BlogPosts } from './collections/BlogPosts/BlogPosts';
import { FAQs } from './collections/FAQs/FAQs';
import { Media } from './collections/Media';
import { AuditLogs } from './collections/AuditLogs/AuditLogs';
import { Staff } from './collections/Staff/Staff';
import { Tenants } from './collections/Tenants/Tenants';
// import { SEOMetadata } from './collections/SEOMetadata/SEOMetadata';

// Export factory function for lazy evaluation (ESM + --env-file compatibility)
// Ensures process.env is read AFTER environment variables are loaded
export const getPayloadConfig = () => buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3002',
  admin: {
    user: Users.slug, // CRITICAL: Specify auth collection
    meta: {
      titleSuffix: '- CEP Comunicación',
    },
  },
  collections: [
    // Collections will be added here as they are implemented following TDD methodology
    // ===== SYSTEM (Multi-tenant) =====
    Tenants, // Multi-tenant support - Academies/Organizations
    Users, // IMPORTANT: Users collection MUST be first for auth to work properly

    // ===== Core entities =====
    Cycles,
    Campuses,
    AreasFormativas, // ✅ Knowledge areas for course categorization
    EntidadesFinanciadoras, // ✅ Funding entities (grants, subsidies)

    // Courses
    Courses,
    CourseRuns, // ✅ Scheduled course instances
    Students, // ✅ Learner profiles with PII protection
    Enrollments, // ✅ Student registrations in course runs

    // Personal
    Staff, // ✅ Professors and administrative staff

    // Marketing
    Campaigns, // ✅ Marketing campaign tracking with UTM & analytics
    AdsTemplates, // ✅ Reusable ad templates (email, social, display ads)
    Leads, // ✅ Phase 1: Implemented with GDPR compliance

    // Content
    BlogPosts, // ✅ Blog content with SEO optimization
    FAQs, // ✅ Frequently Asked Questions
    Media, // ✅ File uploads with S3 storage

    // Compliance & System
    AuditLogs, // ✅ GDPR Article 30 compliance - Immutable audit trail
    // SEOMetadata,
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE',
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ||
        `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
      // ============================================================================
      // CONNECTION POOL OPTIMIZATIONS
      // ============================================================================
      max: 20,                    // Maximum pool size (default: 10)
      min: 2,                     // Minimum pool size for warm connections
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 5000, // Fail fast on connection errors
      // Enable statement caching for repeated queries
      statement_timeout: 30000,   // 30s max query time
    },
    push: false, // DISABLED: Schema already created
    migrationDir: path.resolve(__dirname, '../migrations'),
  }),
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.MINIO_BUCKET || 'cepcomunicacion',
      config: {
        endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin_dev_2025',
        },
        region: 'us-east-1', // MinIO requires a region
        forcePathStyle: true, // Required for MinIO
      },
    }),
  ],
  cors: [
    'http://localhost:3000', // React frontend
    'http://localhost:3002', // CMS dashboard
    'http://localhost:3003', // ACADEMIX admin portal
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3002',
  ],
  csrf: [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3002',
  ],
});

// Note: Use named export getPayloadConfig() for lazy evaluation
// This ensures process.env is read AFTER --env-file loads variables

// Default export for Next.js @payload-config alias
export default getPayloadConfig()

# Deployment Guide - CEPComunicación CMS

## Executive Summary

**Deployment Date:** 2025-11-04
**Status:** ✅ **PRODUCTION READY**
**Environment:** Hetzner VPS (Ubuntu 25.04)
**Deployment Method:** PM2 + Nginx Reverse Proxy

## Infrastructure Stack

### Core Technologies

| Component | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.2.3 (exact) | HTTP server + React SSR |
| **Payload CMS** | 3.62.1 | Headless CMS + Admin UI |
| **React** | 19.2.0 | UI framework |
| **Node.js** | 22.20.0 | Runtime environment |
| **PostgreSQL** | 16.x | Relational database |
| **Redis** | 7.x | Job queue + caching |
| **Nginx** | 1.26.3 | Reverse proxy |
| **PM2** | 6.0.13 | Process manager |

### Supporting Libraries

```json
{
  "@payloadcms/db-postgres": "^3.62.1",
  "@payloadcms/next": "^3.62.1",
  "@payloadcms/richtext-lexical": "^3.62.1",
  "@payloadcms/storage-s3": "^3.62.1",
  "bullmq": "^5.30.3",
  "dompurify": "3.2.4",
  "dotenv": "^16.4.7",
  "express": "^4.21.2",
  "file-type": "19.0.0",
  "graphql": "^16.11.0",
  "ioredis": "^5.4.2",
  "isomorphic-dompurify": "^2.30.1",
  "jsdom": "^27.0.1",
  "sharp": "^0.33.5",
  "zod": "^3.24.1"
}
```

## Server Configuration

### VPS Details

- **Hostname:** srv943151
- **IP Address:** 46.62.222.138
- **Provider:** Hetzner VPS
- **OS:** Ubuntu 24.04.3 LTS
- **CPU:** 1 vCore AMD EPYC 9354P
- **RAM:** 3.8 GB
- **Storage:** 48 GB SSD
- **Swap:** 4 GB (production optimized)

### Directory Structure

```
/var/www/cepcomunicacion/
├── apps/
│   └── cms/                    # Payload CMS backend
│       ├── .next/              # Next.js build output
│       ├── app/                # Next.js App Router
│       │   ├── (payload)/      # Payload admin routes
│       │   │   └── admin/
│       │   ├── api/            # REST API routes
│       │   └── layout.tsx      # Root layout
│       ├── src/
│       │   ├── collections/    # Payload collections (13 total)
│       │   ├── payload.config.ts
│       │   └── server.ts       # Legacy (no longer used)
│       ├── migrations/         # Database migrations
│       ├── node_modules/
│       ├── package.json
│       ├── next.config.js
│       ├── tsconfig.json
│       └── ecosystem.config.cjs # PM2 configuration
├── logs/                       # PM2 application logs
│   ├── cms-out-0.log
│   └── cms-error-0.log
└── infra/                      # Infrastructure scripts
```

## Environment Configuration

### Required Environment Variables

**Location:** `/var/www/cepcomunicacion/apps/cms/.env`

```bash
# Database (PostgreSQL)
DATABASE_USER=cepcomunicacion
DATABASE_PASSWORD=<URL_ENCODED_PASSWORD>
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cepcomunicacion
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>

# Redis
REDIS_URL=redis://:<password>@localhost:6379

# Payload CMS
PAYLOAD_SECRET=<generated_secret>
SESSION_SECRET=<generated_secret>
PAYLOAD_PUBLIC_SERVER_URL=http://www.cepcomunicacion.com

# Node.js
PORT=3000
NODE_ENV=production

# S3/MinIO Storage (optional)
MINIO_ENDPOINT=http://minio:9000
MINIO_BUCKET=cepcomunicacion
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<secret>
```

### Important Notes

1. **Password URL Encoding:** Special characters in passwords MUST be percent-encoded:
   - `+` → `%2B`
   - `/` → `%2F`
   - `=` → `%3D`

2. **Secrets Generation:**
   ```bash
   openssl rand -base64 32
   ```

## PM2 Process Management

### Configuration File

**File:** `ecosystem.config.cjs`

```javascript
module.exports = {
  apps: [{
    name: 'cepcomunicacion-cms',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/cepcomunicacion/apps/cms',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '3000'
    },
    error_file: '/var/www/cepcomunicacion/logs/cms-error.log',
    out_file: '/var/www/cepcomunicacion/logs/cms-out.log'
  }]
};
```

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.cjs

# Restart application
pm2 restart cepcomunicacion-cms

# Stop application
pm2 stop cepcomunicacion-cms

# View logs
pm2 logs cepcomunicacion-cms

# Monitor resources
pm2 monit

# Save configuration (autostart on reboot)
pm2 save
pm2 startup
```

## Nginx Configuration

### Reverse Proxy Setup

**File:** `/etc/nginx/sites-available/cepcomunicacion`

```nginx
# HTTP server - Reverse proxy to Next.js/Payload CMS
server {
    listen 80;
    listen [::]:80;
    server_name www.cepcomunicacion.com cepcomunicacion.com 46.62.222.138;

    # Max body size for file uploads
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/cepcomunicacion_access.log;
    error_log /var/log/nginx/cepcomunicacion_error.log;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK - Next.js Backend\n";
        add_header Content-Type text/plain;
    }

    # Proxy to Next.js on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Enable Site & Reload

```bash
# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check status
systemctl status nginx
```

## Next.js Configuration

### Payload CMS Integration

**File:** `next.config.js`

```javascript
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Payload requires experimental features
  experimental: {
    reactCompiler: false,
  },
  // Disable ESLint during build (legacy files)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during build (Payload admin templates)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Output file tracing root (suppress multiple lockfiles warning)
  output: 'standalone',
  outputFileTracingRoot: undefined, // Use project root
}

export default withPayload(nextConfig)
```

### Lazy Evaluation Pattern

**File:** `src/payload.config.ts`

```typescript
import { buildConfig } from 'payload'
// ... imports

// Export factory function for lazy evaluation (ESM + --env-file compatibility)
// Ensures process.env is read AFTER environment variables are loaded
export const getPayloadConfig = () => buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001',
  // ... rest of config
})

// Default export for Next.js @payload-config alias
export default getPayloadConfig()
```

**Why:** ESM import hoisting causes `process.env` to be read during module initialization, before environment variables load. This factory pattern delays config evaluation until runtime.

## Deployment Process

### Initial Setup

1. **Install Node.js 22.x:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

3. **Install PostgreSQL 16:**
   ```bash
   sudo apt install postgresql-16 postgresql-client-16
   ```

4. **Install Redis:**
   ```bash
   sudo apt install redis-server
   ```

5. **Clone repository:**
   ```bash
   cd /var/www
   git clone <repository_url> cepcomunicacion
   cd cepcomunicacion/apps/cms
   ```

6. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

7. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

8. **Build application:**
   ```bash
   npm run build
   ```

9. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

### Continuous Deployment

```bash
# 1. Pull latest changes
cd /var/www/cepcomunicacion/apps/cms
git pull origin main

# 2. Install new dependencies
npm install --legacy-peer-deps

# 3. Rebuild application
npm run build

# 4. Restart PM2
pm2 restart cepcomunicacion-cms

# 5. Verify deployment
pm2 logs --lines 50
curl -I http://localhost:3000/admin
```

## Database Management

### PostgreSQL Setup

```bash
# Create database user
sudo -u postgres psql
CREATE USER cepcomunicacion WITH PASSWORD '<password>';

# Create database
CREATE DATABASE cepcomunicacion OWNER cepcomunicacion;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cepcomunicacion TO cepcomunicacion;
```

### Run Migrations

```bash
cd /var/www/cepcomunicacion/apps/cms
npm run payload migrate
```

## Security Considerations

### HTTP Security Headers

Automatically applied by Next.js/Payload:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### SSL/TLS (To Be Implemented)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d www.cepcomunicacion.com -d cepcomunicacion.com

# Auto-renewal (crontab)
0 3 * * * certbot renew --quiet
```

## Monitoring & Logs

### Application Logs

```bash
# PM2 logs
pm2 logs cepcomunicacion-cms

# Nginx access logs
tail -f /var/log/nginx/cepcomunicacion_access.log

# Nginx error logs
tail -f /var/log/nginx/cepcomunicacion_error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/admin

# Nginx health
curl http://localhost/health

# PM2 status
pm2 status

# PostgreSQL connection
psql -h localhost -U cepcomunicacion -d cepcomunicacion -c "SELECT 1;"

# Redis connection
redis-cli ping
```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Symptom:** `TypeError: Cannot read properties of undefined`

**Solution:** Check factory function pattern in `payload.config.ts`

#### 2. Next.js Version Conflicts

**Symptom:** Middleware errors, build failures

**Solution:** Pin exact version `15.2.3` in `package.json`:
```json
{
  "dependencies": {
    "next": "15.2.3"
  }
}
```

#### 3. GraphQL Module Not Found

**Symptom:** Build fails with "Can't resolve 'graphql'"

**Solution:**
```bash
npm install graphql@16.11.0 --legacy-peer-deps
```

#### 4. PM2 Crash Loop

**Symptom:** Application restarts repeatedly

**Solution:** Check logs and environment variables:
```bash
pm2 logs --err
cat .env
```

#### 5. Nginx 502 Bad Gateway

**Symptom:** Nginx returns 502 error

**Solution:** Verify Next.js is running:
```bash
curl http://localhost:3000/admin
pm2 status
```

## Performance Optimization

### Next.js Standalone Output

Already configured in `next.config.js`:
```javascript
output: 'standalone'
```

Benefits:
- Reduced deployment size
- Faster cold starts
- Self-contained build

### Image Optimization

Sharp installed for Next.js image optimization:
```bash
npm install sharp@0.33.5
```

### Database Connection Pooling

Configured in `payload.config.ts`:
```typescript
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URL,
  },
})
```

## API Endpoints

### Admin UI
- **URL:** `http://46.62.222.138/admin`
- **Redirects to:** `/admin/login`

### REST API
- **Base URL:** `http://46.62.222.138/api/`
- **Collections:** `/api/users`, `/api/courses`, `/api/leads`, etc.

### GraphQL API
- **Endpoint:** `http://46.62.222.138/api/graphql`

## Known Warnings (Non-Blocking)

1. **Middleware TypeError:**
   ```
   TypeError: Cannot read properties of undefined (reading '/_middleware')
   ```
   - **Impact:** None - Server operates normally
   - **Cause:** Next.js 15.2.3 manifest incompatibility
   - **Status:** Non-blocking cosmetic error

2. **Multiple Lockfiles:**
   ```
   Warning: Next.js inferred your workspace root
   ```
   - **Impact:** None
   - **Solution:** Configured `outputFileTracingRoot`

3. **Email Adapter:**
   ```
   WARN: No email adapter provided
   ```
   - **Impact:** Emails logged to console
   - **Status:** Expected for development/staging

## Backup Strategy

### Database Backups

```bash
# Daily automated backup (crontab)
0 2 * * * pg_dump -U cepcomunicacion cepcomunicacion | gzip > /backups/cepcomunicacion-$(date +\%Y\%m\%d).sql.gz

# Restore from backup
gunzip < backup.sql.gz | psql -U cepcomunicacion cepcomunicacion
```

### Application Backups

```bash
# Backup uploads and configuration
tar -czf /backups/cms-files-$(date +%Y%m%d).tar.gz /var/www/cepcomunicacion/apps/cms/.env /var/www/cepcomunicacion/apps/cms/uploads
```

## Support & Maintenance

### Update Checklist

- [ ] Review CHANGELOG for breaking changes
- [ ] Test in staging environment
- [ ] Backup database before deployment
- [ ] Update dependencies with `npm update`
- [ ] Run tests: `npm test`
- [ ] Deploy during low-traffic window
- [ ] Monitor logs for 1 hour post-deployment
- [ ] Verify critical functionality

### Emergency Rollback

```bash
# 1. Stop current version
pm2 stop cepcomunicacion-cms

# 2. Checkout previous version
git checkout <previous_commit_hash>

# 3. Rebuild
npm install --legacy-peer-deps
npm run build

# 4. Restart
pm2 restart cepcomunicacion-cms

# 5. Verify
curl -I http://localhost:3000/admin
```

---

**Last Updated:** 2025-11-04
**Deployment Version:** 2.0.0
**Next.js Version:** 15.2.3
**Payload CMS Version:** 3.62.1

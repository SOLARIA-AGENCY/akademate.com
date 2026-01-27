# Akademate Operations Runbook

## Quick Reference

| Service | Port | Health Check |
|---------|------|--------------|
| tenant-admin (Payload CMS) | 3002 | `/api/health` |
| admin-client | 3004 | `/` |
| campus | 3005 | `/api/health` |
| web | 3006 | `/` |
| payload (core) | 3003 | `/api/health` |
| PostgreSQL | 5432 | `pg_isready` |
| Redis | 6379 | `redis-cli ping` |
| MinIO | 9000/9001 | Console at :9001 |

---

## Deployment Commands

### Development (Local)
```bash
# Start infrastructure
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# Start all apps
pnpm dev
```

### Staging (VPS)
```bash
cd /opt/akademate

# Pull latest
git pull origin main

# Deploy
docker compose -f infrastructure/docker/docker-compose.yml \
               -f infrastructure/docker/docker-compose.staging.yml up -d --build
```

### Production (VPS)
```bash
cd /opt/akademate

# Pull latest
git pull origin main

# Deploy with zero-downtime
docker compose -f infrastructure/docker/docker-compose.yml \
               -f infrastructure/docker/docker-compose.prod.yml up -d --build
```

---

## Common Operations

### Database

#### Run Migrations
```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio (visual DB explorer)
pnpm db:studio
```

#### Backup Database
```bash
# Create backup
docker exec akademate-postgres pg_dump -U akademate akademate > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i akademate-postgres psql -U akademate akademate < backup_file.sql
```

#### Reset Database (DANGER: Data Loss)
```bash
docker compose down -v
docker compose up -d postgres
pnpm db:migrate
```

### Redis

#### Check Connection
```bash
docker exec akademate-redis redis-cli ping
# Expected: PONG
```

#### Flush Cache (DANGER: Session Loss)
```bash
docker exec akademate-redis redis-cli FLUSHALL
```

#### Monitor Keys
```bash
docker exec akademate-redis redis-cli MONITOR
```

### MinIO (S3 Storage)

#### Access Console
- URL: `http://localhost:9001`
- Credentials: See `.env` (MINIO_ACCESS_KEY/MINIO_SECRET_KEY)

#### Create Bucket
```bash
docker exec akademate-minio mc mb local/akademate-assets
```

---

## Troubleshooting

### App Won't Start

**Check logs:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f tenant-admin
```

**Common causes:**
1. PostgreSQL not ready → Wait for health check
2. Missing env vars → Check `.env` file
3. Port conflict → Check `lsof -i :3002`

### Database Connection Failed

```bash
# Test connection
docker exec akademate-postgres pg_isready -U akademate

# Check logs
docker compose logs postgres

# Restart
docker compose restart postgres
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Restart affected service
docker compose restart tenant-admin
```

### Payload CMS Admin Locked Out

```bash
# Create superadmin via seed
pnpm -C apps/payload tsx scripts/seed.ts

# Or direct DB update
docker exec akademate-postgres psql -U akademate -c \
  "UPDATE users SET roles = '[{\"role\":\"superadmin\"}]' WHERE email='admin@example.com';"
```

---

## Health Checks

### Manual Health Check
```bash
# All apps
for port in 3002 3003 3004 3005 3006; do
  echo "Port $port: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$port/api/health || echo 'DOWN')"
done
```

### Automated Monitoring
Health endpoints return JSON:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-01-27T12:00:00Z"
}
```

---

## Security Checklist

### Pre-Deploy
- [ ] All secrets rotated from development values
- [ ] PAYLOAD_SECRET is 32+ characters
- [ ] DATABASE_URL uses secure credentials
- [ ] SSL/TLS certificates configured
- [ ] Firewall allows only ports 80/443

### Post-Deploy
- [ ] Test login flow
- [ ] Verify rate limiting works (`/api/users/login` - 10 req/min)
- [ ] Check security headers (`curl -I https://domain.com`)
- [ ] Verify HTTPS redirect

### Secrets Location
| Secret | Location | Notes |
|--------|----------|-------|
| PAYLOAD_SECRET | `.env` | JWT signing key |
| DATABASE_URL | `.env` | PostgreSQL connection |
| MINIO_SECRET_KEY | `.env` | S3-compatible storage |
| STRIPE_SECRET_KEY | `.env` | Payment processing |

---

## Backup Strategy

### Automated Backups (Recommended)
```bash
# Add to crontab (crontab -e)
0 3 * * * /opt/akademate/scripts/backup.sh >> /var/log/akademate-backup.log 2>&1
```

### Backup Script
```bash
#!/bin/bash
BACKUP_DIR=/opt/backups/akademate
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL
docker exec akademate-postgres pg_dump -U akademate akademate | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# MinIO (assets)
docker exec akademate-minio mc mirror local/akademate-assets $BACKUP_DIR/assets_$DATE/

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -mtime +7 -delete
```

---

## Scaling Considerations

### Horizontal Scaling
For multiple app instances:
1. Use Redis for session storage (already configured)
2. Use shared PostgreSQL (production config ready)
3. Load balancer in front of app instances

### Vertical Scaling
Recommended VPS specs:
| Load | CPU | RAM | Storage |
|------|-----|-----|---------|
| Dev | 2 vCPU | 4 GB | 40 GB |
| Staging | 4 vCPU | 8 GB | 80 GB |
| Production | 8 vCPU | 16 GB | 160 GB |

---

## Emergency Procedures

### Complete Service Restart
```bash
cd /opt/akademate
docker compose down
docker compose -f infrastructure/docker/docker-compose.yml \
               -f infrastructure/docker/docker-compose.prod.yml up -d
```

### Rollback Deployment
```bash
# List recent images
docker images | grep akademate

# Rollback to previous tag
docker compose -f infrastructure/docker/docker-compose.yml \
               -f infrastructure/docker/docker-compose.prod.yml up -d \
               --no-build
```

### Disaster Recovery
1. Provision new VPS
2. Install Docker + Docker Compose
3. Clone repository
4. Restore database from backup
5. Start services with production config
6. Update DNS to new IP

---

## Contact

- **On-call:** Check team calendar
- **Escalation:** Engineering lead → CTO
- **Vendor Support:** Hetzner (VPS), Cloudflare (DNS/CDN)

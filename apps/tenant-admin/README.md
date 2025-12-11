# CEPComunicacion CMS (Payload v3)

Backend CMS for lead management and marketing automation platform.

## ⚠️ Critical Configuration

### TailwindCSS v4 Setup

**IMPORTANT:** This project uses TailwindCSS v4.x which has a breaking change from v3.x.

**Colors MUST be defined in `theme.colors` (NOT `theme.extend.colors`)**

If configured incorrectly, utility classes like `.bg-background`, `.text-foreground` will NOT be generated and the dashboard will appear completely unstyled.

**Correct configuration:**
- `tailwind.config.js` - Colors in `theme.colors` ✅
- `postcss.config.cjs` - Uses `@tailwindcss/postcss` plugin ✅
- `app/globals.css` - CSS variables defined in `:root` ✅

For complete configuration details and verification steps, see `../../agents.md`.

---

## Architecture

This CMS follows **Test-Driven Development (TDD)** methodology:

1. **Write tests first** (RED)
2. **Implement minimal code to pass** (GREEN)
3. **Refactor and optimize** (REFACTOR)

## Project Structure

```
apps/cms/
├── src/
│   ├── server.ts                    # Express server entry point
│   ├── payload.config.ts             # Payload CMS configuration
│   ├── collections/                  # Collection definitions
│   │   ├── index.ts                  # Export all collections
│   │   ├── Cycles/                   # Educational cycles
│   │   ├── Campuses/                 # Training locations
│   │   ├── Users/                    # CMS users with RBAC
│   │   ├── Courses/                  # Course catalog
│   │   ├── CourseRuns/               # Scheduled courses
│   │   ├── Campaigns/                # Marketing campaigns
│   │   ├── AdsTemplates/             # Ad creatives
│   │   ├── Leads/                    # Lead submissions (GDPR)
│   │   ├── BlogPosts/                # Content management
│   │   ├── FAQs/                     # FAQ entries
│   │   ├── Media/                    # File uploads
│   │   ├── SEOMetadata/              # SEO data
│   │   └── AuditLogs/                # GDPR audit trail
│   ├── access/                       # Shared access control
│   │   ├── index.ts                  # Common access functions
│   │   └── roles.ts                  # Role definitions
│   ├── hooks/                        # Shared hooks
│   │   ├── index.ts
│   │   └── auditLog.ts               # GDPR audit logging
│   └── utils/                        # Utility functions
│       ├── slugify.ts                # URL slug generation
│       └── testHelpers.ts            # Test utilities
└── tests/
    ├── setup.ts                      # Test setup
    └── teardown.ts                   # Test cleanup
```

## Role-Based Access Control (RBAC)

The system implements 5 user roles with hierarchical permissions:

1. **Admin** (Level 5)
   - Full system access
   - User management
   - System configuration

2. **Gestor** (Level 4)
   - Manage content
   - Manage users (except admins)
   - Moderate submissions

3. **Marketing** (Level 3)
   - Create/edit marketing content
   - View analytics
   - Manage campaigns

4. **Asesor** (Level 2)
   - Read-only access to client data
   - Create notes/interactions

5. **Lectura** (Level 1)
   - Read-only access to public content

## Collections Overview

### 1. Cycles
Educational cycle types (FP Básica, Grado Medio, Grado Superior)

### 2. Campuses
Physical training locations with address information

### 3. Users
CMS users with role-based access control and authentication

### 4. Courses
Course catalog with relationships to cycles

### 5. CourseRuns
Scheduled course instances with dates and locations

### 6. Campaigns
Marketing campaigns with tracking

### 7. AdsTemplates
Ad creative templates for campaigns

### 8. Leads
Lead submissions with GDPR compliance

### 9. BlogPosts
Content management with SEO

### 10. FAQs
Frequently asked questions

### 11. Media
File uploads (images, documents)

### 12. SEOMetadata
SEO optimization data for pages

### 13. AuditLogs
GDPR audit trail for all operations

## Development Workflow

### 1. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Install dependencies (from root)
pnpm install

# Start PostgreSQL and other services
docker compose up -d postgres redis minio
```

### 2. Run Tests (TDD)

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### 3. Development Server

```bash
# Start dev server with hot reload
pnpm dev
```

### 4. Build for Production

```bash
# Type check
pnpm typecheck

# Build
pnpm build

# Start production server
pnpm start
```

## TDD Implementation Process

For each collection:

### Step 1: Write Tests (RED)

Create `CollectionName.test.ts` with:
- API integration tests
- Access control tests
- Validation tests
- Relationship tests (if applicable)

### Step 2: Implement Collection (GREEN)

Create `CollectionName.ts` with minimal code to pass tests:
- Define fields
- Basic access control
- Required validations

### Step 3: Refactor (REFACTOR)

Add:
- Advanced validation
- Hooks (beforeChange, afterChange, etc.)
- Field-level permissions
- Custom endpoints
- Documentation

## Testing Standards

- Minimum 80% code coverage
- All tests must pass before merge
- Test both happy paths and error cases
- Test access control for all roles
- Test GDPR compliance features

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `DATABASE_*`: PostgreSQL connection
- `PAYLOAD_SECRET`: JWT secret (32+ chars)
- `PAYLOAD_PUBLIC_SERVER_URL`: Public URL
- `REDIS_*`: Redis for job queues
- `MINIO_*`: S3-compatible storage

## API Documentation

Once running, access:
- Admin Panel: http://localhost:3001/admin
- REST API: http://localhost:3001/api
- GraphQL: http://localhost:3001/api/graphql

## Security Best Practices

1. Never commit `.env` files
2. Use strong `PAYLOAD_SECRET` in production
3. Implement rate limiting
4. Validate all inputs
5. Sanitize user data
6. Enable CORS appropriately
7. Use HTTPS in production
8. Regular security audits

## GDPR Compliance

All collections that handle personal data:
- Implement audit logging
- Support data export
- Support data deletion
- Track consent
- Log access

## Next Steps

1. Implement Cycles collection (TDD)
2. Implement Campuses collection (TDD)
3. Implement Users collection with authentication (TDD)
4. Implement remaining collections
5. Add advanced features (webhooks, integrations)

## Contributing

Follow TDD methodology strictly:
1. Write failing test
2. Write minimal code to pass
3. Refactor and optimize
4. Ensure all tests pass
5. Meet coverage requirements

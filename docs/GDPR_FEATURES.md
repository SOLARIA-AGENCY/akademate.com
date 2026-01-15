# GDPR Features Documentation

**Task:** P2-001 - GDPR Features [GDPR-001]
**Status:** ⚠️ DOCUMENTED - Implementation Required
**Date:** 15 Enero 2026

---

## Overview

GDPR compliance requires implementing 4 fundamental rights for EU citizens:

1. **Right to Access** (Data Export)
2. **Right to Deletion** (Anonymization)
3. **Consent Management** (Withdrawal & Tracking)
4. **Data Retention Policies** (TTL & Cleanup)

---

## Current State

### Existing GDPR Implementation

✅ **ANONYMIZATION** (`packages/api/src/gdpr/anonymize.ts`)

- Service for user data anonymization
- Updates sensitive fields to DELETED placeholders
- Tracks anonymization in audit logs

✅ **CONSENT LOGGING** (`packages/api/src/gdpr/consent.ts`)

- Consent tracking for marketing emails
- IP and timestamp logging
- Withdrawal support

✅ **DATA RETENTION** (`packages/api/src/gdpr/retention.ts`)

- Retention policy definitions
- TTL configuration per data type
- Job hooks for automated cleanup

✅ **DATA EXPORT** (`packages/api/src/gdpr/export.ts`)

- Complete user data export
- Multi-table aggregation
- JSON export format

✅ **TYPES** (`packages/api/src/gdpr/types.ts`)

- GDPR event types
- Export/Anonymize payloads
- Consent tracking types

⚠️ **INCOMPLETE: API Endpoints**

- Services exist but no HTTP endpoints exposed
- No UI in tenant-admin for GDPR requests
- No webhook handlers for automated actions

---

## Required Implementation

### 1. Right to Access - API Endpoint (4h)

**Create:** `apps/tenant-admin/app/api/gdpr/[userId]/export/route.ts`

```typescript
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  // Authenticate admin or self-user
  // Call GDPRDataExportService.exportUserData()
  // Return JSON with all user data
  // Include download filename header
}
```

**Authentication:**

- Admin users: Can export any user data
- Regular users: Can only export own data
- JWT token validation required

**Response Format:**

```json
{
  "exportedAt": "2026-01-15T15:00:00Z",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440002",
  "data": {
    "user": { ... },
    "enrollments": [ ... ],
    "quizResults": [ ... ],
    "payments": [ ... ],
    "consentLogs": [ ... ]
  }
}
```

---

### 2. Right to Deletion - API Endpoint (4h)

**Create:** `apps/tenant-admin/app/api/gdpr/[userId]/delete/route.ts`

```typescript
export async function POST(request: Request, { params }: { params: { userId: string } }) {
  // Require re-authentication (password verification)
  // Call GDPRDataDeletionService.anonymizeUser()
  // Log deletion request
  // Send confirmation email
}
```

**Security Requirements:**

- Re-authentication required (password confirmation)
- 30-day grace period for data recovery (configurable)
- Soft delete (anonymization) preferred over hard delete
- Audit log of all deletion requests

**Confirmation Flow:**

1. User requests deletion → Email sent
2. User clicks confirm link → Password re-auth
3. Data anonymized → Confirmation sent
4. 30-day recovery period ends → Hard delete optional

---

### 3. Consent Management - UI & Endpoints (4h)

**Create:** `apps/tenant-admin/app/api/gdpr/[userId]/consent/route.ts`

```typescript
// GET: Current consent status
export async function GET(/* ... */) {
  return {
    marketingEmail: true,
    analyticsTracking: false,
    cookiesConsent: true,
    updatedAt: '2026-01-15T...',
  }
}

// POST: Update consent
export async function POST(request, { params }) {
  const { type, consent } = await request.json()

  // Update consent_logs table
  // Invalidate marketing segments if withdrawn
  // Update cookie consent if applicable
}
```

**UI Components to Create:**

`apps/tenant-admin/app/settings/gdpr/page.tsx`

- Consent checkboxes (marketing, analytics, cookies)
- Data export button
- Data deletion button with re-auth flow
- Consent history table

---

### 4. Data Retention - Automated Jobs (4h)

**Create:** `packages/jobs/src/gdpr/retention.ts`

```typescript
import { Worker } from 'bullmq'
import { db } from '@akademate/db'

export const gdprRetentionJob: Worker = async (job) => {
  const { userId, dataType } = job.data

  // Check retention policy
  const policy = RetentionPolicies[dataType]

  // Delete/expired data older than policy
  await db.query.tableName.deleteMany({
    where: {
      userId,
      createdAt: { lt: Date.now() - policy.ttl }
    }
  })

  // Log deletion
  await db.insert(auditLogs).values({ ... })
}
```

**Retention Policies:**

```typescript
const RetentionPolicies = {
  quizResults: '2 years',
  enrollments: '7 years',
  courseAccessLogs: '1 year',
  paymentRecords: '7 years',
  consentLogs: '5 years',
}
```

---

## Database Schema Requirements

### Verify Existing Tables

```sql
-- Consent logging (should exist in packages/db)
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  consent_type VARCHAR(50) NOT NULL,
  consent_granted BOOLEAN NOT NULL,
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Anonymization logs (should exist)
CREATE TABLE IF NOT EXISTS anonymization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  reason TEXT NOT NULL,
  anonymized_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP, -- 30-day recovery window
  performed_by UUID REFERENCES users(id)
);
```

---

## Security & Compliance Checklist

- [ ] All GDPR actions require authentication
- [ ] Data export includes all user-associated data
- [ ] Deletion requires password re-authentication
- [ ] 30-day recovery period for deleted accounts
- [ ] Consent tracking with IP and timestamps
- [ ] Automated retention policy enforcement
- [ ] Audit logs for all GDPR actions
- [ ] User cannot withdraw consent if legally required (e.g., enrollment records)
- [ ] Data export available within 30 days of request (GDPR Art. 15)
- [ ] Data deletion completed within 30 days of request (GDPR Art. 17)

---

## Testing Requirements

```typescript
// packages/api/__tests__/gdpr.test.ts (extends existing)

describe('GDPR Data Export', () => {
  it('should export all user data', async () => { ... })
  it('should only allow users to export own data', async () => { ... })
  it('should allow admins to export any user data', async () => { ... })
})

describe('GDPR Data Deletion', () => {
  it('should anonymize user data on deletion', async () => { ... })
  it('should require password re-auth', async () => { ... })
  it('should log deletion request', async () => { ... })
  it('should allow recovery within 30 days', async () => { ... })
})

describe('GDPR Consent Management', () => {
  it('should track consent status', async () => { ... })
  it('should allow consent withdrawal', async () => { ... })
  it('should log consent changes with IP', async () => { ... })
})

describe('GDPR Data Retention', () => {
  it('should delete expired data', async () => { ... })
  it('should respect retention policies', async () => { ... })
})
```

---

## Estimated Effort

| Component                 | Est. Time | Priority |
| ------------------------- | --------- | -------- |
| Export API Endpoint       | 4h        | P1       |
| Deletion API Endpoint     | 4h        | P1       |
| Consent Management API+UI | 4h        | P1       |
| Retention Jobs            | 4h        | P1       |
| Tests                     | 2h        | P2       |
| **Total**                 | **18h**   | -        |

**Original estimate:** 16h (underestimated by 2h)

---

## Dependencies

- ✅ Services exist in `packages/api/src/gdpr/`
- ✅ Database tables (need verification)
- ✅ Auth middleware exists
- ✅ Email service exists (for confirmations)

---

## Next Steps

1. **Implement Export API** (4h)
2. **Implement Deletion API** (4h)
3. **Implement Consent API** (4h)
4. **Create Retention Jobs** (4h)
5. **Add Tests** (2h)
6. **Create GDPR UI** (additional time - not estimated)

---

**Documented by:** Ralph-Wiggum (Eco-Sigma)
**Status:** Ready for implementation
**Est. Remaining:** 18 hours

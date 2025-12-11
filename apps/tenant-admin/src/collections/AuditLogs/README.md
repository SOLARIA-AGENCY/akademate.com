# AuditLogs Collection - GDPR Compliance & Security Audit Trail

**Status:** ✅ Production Ready
**GDPR Article:** 30 (Records of Processing Activities)
**Retention Period:** 7 years (Spain)
**Last Updated:** 2025-10-31

---

## Table of Contents

1. [Overview](#overview)
2. [GDPR Compliance](#gdpr-compliance)
3. [Collection Schema](#collection-schema)
4. [Access Control Matrix](#access-control-matrix)
5. [Field Descriptions](#field-descriptions)
6. [Hooks & Automation](#hooks--automation)
7. [Query Examples](#query-examples)
8. [Integration Guide](#integration-guide)
9. [Performance Optimization](#performance-optimization)
10. [Security Considerations](#security-considerations)
11. [Retention Policy](#retention-policy)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The **AuditLogs collection** implements a comprehensive, immutable audit trail for GDPR Article 30 compliance. It records all data processing activities across the CEPComunicacion platform, providing legal evidence of data operations and enabling forensic investigations.

### Purpose

- **Legal Compliance:** GDPR Article 30 requires organizations to maintain records of processing activities
- **Security Monitoring:** Track all system operations for threat detection
- **Forensic Analysis:** Investigate security incidents with complete audit trail
- **User Accountability:** Link all actions to specific users with timestamp and IP
- **Right to Erasure:** Support GDPR Article 17 (Admin can delete user audit logs)

### Key Features

- ✅ **Immutable Audit Trail** - No updates allowed (defense in depth: UI + API + Hook + DB)
- ✅ **Comprehensive Logging** - CRUD operations, security events, data exports
- ✅ **PII Protection** - Field-level access control on IP addresses and emails
- ✅ **High Performance** - Strategic indexes for fast queries on large datasets
- ✅ **Auto-Capture** - IP address, user agent, timestamps populated automatically
- ✅ **Sanitized Changes** - Sensitive fields (passwords) removed from snapshots
- ✅ **7-Year Retention** - Compliant with Spanish legal requirements

---

## GDPR Compliance

### Article 30: Records of Processing Activities

**Legal Requirement:**
> "Each controller and, where applicable, the controller's representative, shall maintain a record of processing activities under its responsibility."

The AuditLogs collection fulfills this requirement by recording:

- **Who:** user_id, user_email, user_role
- **What:** action (create/read/update/delete/export/login/logout)
- **When:** createdAt timestamp (auto-generated)
- **Where:** ip_address (IPv4 or IPv6)
- **Which:** collection_name, document_id
- **How:** user_agent (browser/client info)
- **Outcome:** status (success/failure/blocked)

### Article 17: Right to Erasure

When a data subject exercises their "right to be forgotten":

1. Admin deletes the user and their data from all collections
2. Admin deletes audit logs containing the user's PII (IP address, email)
3. System creates a new audit log entry recording the erasure operation
4. Retention: Erasure logs kept for 7 years as legal evidence

### Article 5: Data Minimization

The collection practices data minimization:

- **Only captures necessary PII:** IP address (forensics), user email (accountability)
- **Sanitizes changes object:** Removes passwords, tokens, secrets before logging
- **Field-level access control:** Restricts PII access to Admin and Gestor only
- **No excessive data:** Does not log full document content, only IDs

### Retention Period: 7 Years (Spain)

Spanish law requires audit logs to be retained for **7 years** from date of creation:

- Legal basis: Ley General Tributaria (Tax Law) - Article 70
- Compliance: Reglamento General de Protección de Datos (RGPD)
- Automated cleanup: Implement job to delete logs older than 7 years (future enhancement)

---

## Collection Schema

### Database Table

**PostgreSQL Table:** `audit_logs`
**Migration File:** `/infra/postgres/migrations/014_create_audit_logs.sql`

### Field Summary (12 fields)

| Field               | Type         | Required | Indexed | Immutable | PII  | Description                          |
| ------------------- | ------------ | -------- | ------- | --------- | ---- | ------------------------------------ |
| `id`                | UUID         | ✅       | ✅      | ✅        | ❌   | Primary key (auto-generated)         |
| `action`            | select       | ✅       | ✅      | ✅        | ❌   | CRUD operation or security event     |
| `collection_name`   | select       | ✅       | ✅      | ✅        | ❌   | Target Payload collection slug       |
| `document_id`       | text         | ❌       | ✅      | ✅        | ❌   | ID of affected document              |
| `user_id`           | relationship | ✅       | ✅      | ✅        | ❌   | User who performed action            |
| `user_email`        | email        | ✅       | ✅      | ✅        | ✅   | Snapshot of user email               |
| `user_role`         | select       | ✅       | ❌      | ✅        | ❌   | User role at time of action          |
| `ip_address`        | text         | ✅       | ✅      | ✅        | ✅   | Client IP address (IPv4 or IPv6)     |
| `user_agent`        | textarea     | ❌       | ❌      | ✅        | ❌   | Browser/client information           |
| `changes`           | json         | ❌       | ❌      | ✅        | ⚠️   | Before/after snapshots (sanitized)   |
| `metadata`          | json         | ❌       | ❌      | ✅        | ⚠️   | Additional context                   |
| `status`            | select       | ✅       | ❌      | ✅        | ❌   | Operation outcome                    |
| `error_message`     | textarea     | ❌       | ❌      | ✅        | ❌   | Error details if status = failure    |
| `createdAt`         | date         | ✅       | ✅      | ✅        | ❌   | Auto-generated timestamp (Payload)   |
| `updatedAt`         | date         | ✅       | ❌      | ✅        | ❌   | Should never change (immutable logs) |

**Legend:**
- ✅ = Yes
- ❌ = No
- ⚠️ = May contain PII depending on changes being logged

---

## Access Control Matrix

### Collection-Level Access

| Role      | Create          | Read              | Update | Delete     |
| --------- | --------------- | ----------------- | ------ | ---------- |
| **Public**    | ❌ Never        | ❌ Never          | ❌ Never | ❌ Never   |
| **Lectura**   | ❌ Never        | ❌ Never          | ❌ Never | ❌ Never   |
| **Asesor**    | ❌ System only  | ✅ Own actions    | ❌ Never | ❌ Never   |
| **Marketing** | ❌ System only  | ✅ Own actions    | ❌ Never | ❌ Never   |
| **Gestor**    | ❌ System only  | ✅ All logs       | ❌ Never | ❌ Never   |
| **Admin**     | ✅ Dev mode only| ✅ All logs       | ❌ Never | ✅ GDPR    |

**Notes:**
- **System only:** Logs created automatically via hooks, not manually via UI/API
- **Own actions:** Query constraint `{ user_id: { equals: currentUser.id } }`
- **Dev mode only:** `process.env.NODE_ENV === 'development'` (for testing)
- **GDPR:** Admin can delete for right to erasure or 7+ year old logs

### Field-Level Access Control

**PII Fields (Restricted Access):**

| Field         | Who Can Read         | Who Can Update |
| ------------- | -------------------- | -------------- |
| `ip_address`  | Admin, Gestor        | NO ONE         |
| `user_email`  | Admin, Gestor        | NO ONE         |
| `changes`     | Admin, Gestor        | NO ONE         |
| `metadata`    | Admin, Gestor        | NO ONE         |

**Standard Fields (Normal Access):**

| Field              | Who Can Read                              | Who Can Update |
| ------------------ | ----------------------------------------- | -------------- |
| All other fields   | Based on collection-level access control  | NO ONE         |

**Immutability:**
ALL fields are immutable after creation. No one, not even Admin, can update audit logs.

---

## Field Descriptions

### 1. action (required, indexed)

**Type:** select (enum)
**Options:** `create`, `read`, `update`, `delete`, `export`, `login`, `logout`, `permission_change`

Categorizes the type of operation performed:

- **create:** New document created
- **read:** Document accessed (optional, can create noise)
- **update:** Document modified
- **delete:** Document deleted
- **export:** Data exported (CSV, PDF, etc.)
- **login:** User authenticated
- **logout:** User session ended
- **permission_change:** User role or permissions modified

**Indexed:** Yes (for filtering by action type in queries)

**Example:**
```json
{
  "action": "update"
}
```

---

### 2. collection_name (required, indexed)

**Type:** select (enum)
**Options:** All Payload collection slugs (see schemas.ts for complete list)

Valid values:
- `users`
- `cycles`
- `campuses`
- `courses`
- `course-runs`
- `leads`
- `enrollments`
- `students`
- `campaigns`
- `ads-templates`
- `blog-posts`
- `faqs`
- `media`
- `audit-logs` (self-referential for meta-auditing)

**Indexed:** Yes (for filtering by collection in compliance reports)

**Validation:** Hook validates that collection_name matches existing collections

**Example:**
```json
{
  "collection_name": "students"
}
```

---

### 3. document_id (optional, indexed)

**Type:** text (UUID or other ID format)
**Max Length:** 255 characters

ID of the specific document affected by the operation.

**Null for:**
- Bulk operations (e.g., mass delete)
- Collection-level operations (e.g., export all)
- Security events (login/logout)

**Indexed:** Yes (for looking up all logs for a specific document)

**Example:**
```json
{
  "document_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

### 4. user_id (required, indexed, relationship)

**Type:** relationship to `users` collection
**Required:** Yes (all actions must be attributed to a user)

References the user who performed the action.

**Relationship Details:**
- `relationTo: 'users'`
- Foreign key constraint in database
- If user is deleted, this field remains (audit trail persists)

**Indexed:** Yes (for filtering by user in accountability reports)

**Special Case - System Actions:**
For automated system actions (cron jobs, webhooks), create a special "System" user with role `admin`.

**Example:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 5. user_email (required, indexed, PII)

**Type:** email
**Required:** Yes
**Max Length:** 255 characters
**Immutable:** Yes (snapshot at time of action)

**Purpose:** Preserve user email even if user is later deleted (GDPR compliance).

**Security:**
- **PII:** Yes (protected by field-level access control)
- **Read Access:** Admin, Gestor only
- **Why snapshot?** If user is deleted, we lose user_id relationship but need email for compliance reports

**Indexed:** Yes (for compliance reports by user email)

**Auto-populated:** Hook extracts email from user_id relationship

**Example:**
```json
{
  "user_email": "maria.garcia@cepcomunicacion.com"
}
```

---

### 6. user_role (required)

**Type:** select (enum)
**Options:** `admin`, `gestor`, `marketing`, `asesor`, `lectura`

**Purpose:** Capture user's role AT THE TIME of action (historical record).

**Why snapshot?**
User roles can change over time. For audit trail accuracy, we need to know what role the user had when they performed the action.

**Not Indexed:** Role is rarely used in queries (user_id is more common)

**Auto-populated:** Hook extracts role from user_id relationship

**Example:**
```json
{
  "user_role": "gestor"
}
```

---

### 7. ip_address (required, indexed, PII)

**Type:** text
**Required:** Yes
**Max Length:** 45 characters (IPv6 max)
**Format:** IPv4 (15 chars) or IPv6 (45 chars)

**Purpose:** Forensic evidence, geolocation, security investigations.

**Security:**
- **PII:** Yes (IP addresses are personally identifiable under GDPR)
- **Read Access:** Admin, Gestor only
- **Immutable:** Critical for forensics (tampering would invalidate evidence)

**Indexed:** Yes (for security investigations, e.g., "show all actions from this IP")

**Auto-populated:** Hook extracts from request headers:
1. `X-Forwarded-For` (if behind proxy/load balancer)
2. `X-Real-IP` (alternative proxy header)
3. `req.ip` (direct connection)
4. `req.socket.remoteAddress` (fallback)

**IPv6 Prefix Handling:**
IPv6-mapped IPv4 addresses (e.g., `::ffff:192.168.1.1`) are cleaned to `192.168.1.1`.

**Examples:**
```json
{
  "ip_address": "148.230.118.124"
}
```
```json
{
  "ip_address": "2a02:4780:28:b773::1"
}
```

---

### 8. user_agent (optional)

**Type:** textarea
**Max Length:** 1000 characters

**Purpose:** Device identification, troubleshooting, security analysis.

**Content:** Full HTTP User-Agent header string.

**Auto-populated:** Hook extracts from `req.headers['user-agent']`

**Not PII:** User agent alone is not personally identifiable (but combined with IP it can be)

**Not Indexed:** Rarely queried, very long strings (poor index performance)

**Example:**
```json
{
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
}
```

---

### 9. changes (optional, json, PII)

**Type:** json
**Structure:** `{ before: {}, after: {} }`

**Purpose:** Before/after snapshots for UPDATE operations.

**Security:**
- **Sanitized:** Hook removes passwords, tokens, secrets, api_keys before logging
- **Field-level access:** Admin, Gestor only (may contain sensitive business data)

**When populated:**
- `action: 'update'` - Compare before/after
- `action: 'create'` - Usually null (or only `after`)
- `action: 'delete'` - Usually only `before`

**Size Limit:** Keep under 10KB (PostgreSQL json performance consideration)

**Example:**
```json
{
  "changes": {
    "before": {
      "status": "open",
      "lead_score": 75
    },
    "after": {
      "status": "converted",
      "lead_score": 95
    }
  }
}
```

**Sanitization Example:**
```json
// BEFORE sanitization (NEVER LOGGED)
{
  "before": { "password": "secret123", "email": "user@example.com" },
  "after": { "password": "newSecret456", "email": "newemail@example.com" }
}

// AFTER sanitization (LOGGED)
{
  "before": { "password": "[REDACTED]", "email": "user@example.com" },
  "after": { "password": "[REDACTED]", "email": "newemail@example.com" }
}
```

---

### 10. metadata (optional, json)

**Type:** json
**Purpose:** Additional context (request headers, query params, custom data)

**Security:**
- **Field-level access:** Admin, Gestor only
- **No sensitive data:** Do not include passwords, tokens in metadata

**Use Cases:**
- HTTP method (GET, POST, PUT, DELETE)
- Query parameters (filters, pagination)
- Referer header (where user came from)
- Custom application metadata (campaign ID, UTM params)

**Example:**
```json
{
  "metadata": {
    "http_method": "POST",
    "query_params": { "filter": "active", "page": 1 },
    "referer": "https://www.cepcomunicacion.com/cursos",
    "utm_source": "facebook",
    "utm_campaign": "spring_2025"
  }
}
```

---

### 11. status (required)

**Type:** select (enum)
**Options:** `success`, `failure`, `blocked`
**Default:** `success`

Outcome of the operation:

- **success:** Operation completed successfully
- **failure:** Operation failed (see error_message)
- **blocked:** Operation blocked by access control or validation

**Not Indexed:** Status distribution is not queried often

**Example:**
```json
{
  "status": "success"
}
```

---

### 12. error_message (optional)

**Type:** textarea
**Max Length:** 2000 characters

**Purpose:** Error details if status = 'failure' or 'blocked'

**Conditional Display:** Only shown in admin UI if `status !== 'success'`

**Security:**
- **No PII:** Do not log emails, IPs, user names in error messages
- **No stack traces:** Redact file paths, internal implementation details

**Example:**
```json
{
  "status": "failure",
  "error_message": "Validation failed: Email format is invalid"
}
```

**Bad Example (DO NOT DO THIS):**
```json
{
  "error_message": "User john.doe@example.com failed to login from 192.168.1.1"
  // ❌ Contains PII (email, IP)
}
```

---

## Hooks & Automation

### Hook Execution Order

**CREATE Operation:**
1. **beforeValidate:**
   - `autoPopulateAuditMetadata` - Extract IP, user agent, email, role from request
   - `validateAuditLogData` - Validate collection_name, user_id, sanitize changes
2. **Payload's built-in validation** - Check required fields, types, formats
3. **beforeChange:**
   - `preventAuditLogUpdates` - (No-op on create, blocks on update)
4. **Database write** - INSERT into `audit_logs` table
5. **afterChange:**
   - (Future) `createMetaAuditLog` - Audit log of audit log creation

**UPDATE Operation (BLOCKED):**
1. **beforeChange:**
   - `preventAuditLogUpdates` - **THROWS ERROR** (operation aborted)
2. ❌ **Operation never reaches database**

**DELETE Operation:**
- Allowed only for Admin role (via access control)
- Should create audit log entry for the deletion (future enhancement)

### Hook Details

#### 1. autoPopulateAuditMetadata

**Type:** beforeValidate
**File:** `/hooks/autoPopulateAuditMetadata.ts`

**Purpose:** Auto-capture audit metadata from request context.

**Populates:**
- `user_email` - From user relationship
- `user_role` - From user relationship
- `ip_address` - From request headers (with fallbacks)
- `user_agent` - From request headers

**Error Handling:** Non-critical errors do not block creation (validation will catch missing required fields).

**Example Log Output:**
```
[AuditLog] Metadata auto-populated {
  hasUserEmail: true,
  hasUserRole: true,
  hasIPAddress: true,
  hasUserAgent: true,
  operation: 'create'
}
```

---

#### 2. validateAuditLogData

**Type:** beforeValidate
**File:** `/hooks/validateAuditLogData.ts`

**Purpose:** Business logic validation before Payload's validation.

**Validations:**
1. **collection_name** must match existing Payload collections
2. **user_id** must reference an existing user
3. **changes** object must be sanitized (remove passwords, tokens)

**Example Error:**
```
Invalid collection_name: "invalid-collection".
Must be one of: users, cycles, campuses, courses, ...
```

---

#### 3. preventAuditLogUpdates

**Type:** beforeChange
**File:** `/hooks/preventAuditLogUpdates.ts`

**Purpose:** Enforce immutability by blocking ALL update operations.

**Logic:**
```typescript
if (operation === 'update') {
  throw new Error('Audit logs are immutable and cannot be updated.');
}
```

**Security:** This is the **THIRD layer** of defense (UI + API + Hook).

**Logged as Warning:**
```
[AuditLog] BLOCKED: Attempt to update audit log {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  userRole: 'admin',
  blocked: true
}
```

---

## Query Examples

### 1. Find All Logs by User

```typescript
const userLogs = await payload.find({
  collection: 'audit-logs',
  where: {
    user_id: { equals: '550e8400-e29b-41d4-a716-446655440000' },
  },
  sort: '-createdAt', // Newest first
  limit: 100,
});
```

---

### 2. Find All Logs for Specific Document

```typescript
const documentLogs = await payload.find({
  collection: 'audit-logs',
  where: {
    collection_name: { equals: 'students' },
    document_id: { equals: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  },
  sort: 'createdAt', // Chronological order
});
```

---

### 3. Find Failed Operations

```typescript
const failures = await payload.find({
  collection: 'audit-logs',
  where: {
    status: { equals: 'failure' },
    createdAt: {
      greater_than: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
    },
  },
  sort: '-createdAt',
});
```

---

### 4. Find All Delete Operations (Compliance Report)

```typescript
const deletions = await payload.find({
  collection: 'audit-logs',
  where: {
    action: { equals: 'delete' },
    collection_name: { equals: 'students' },
  },
  sort: '-createdAt',
  limit: 1000,
});
```

---

### 5. Find All Actions from Specific IP (Security Investigation)

```typescript
const suspiciousIP = await payload.find({
  collection: 'audit-logs',
  where: {
    ip_address: { equals: '192.168.1.100' },
    createdAt: {
      greater_than: '2025-10-01T00:00:00Z',
      less_than: '2025-10-31T23:59:59Z',
    },
  },
  sort: 'createdAt',
});
```

---

### 6. Compliance Report: Data Exports by User

```typescript
const exports = await payload.find({
  collection: 'audit-logs',
  where: {
    action: { equals: 'export' },
    user_email: { equals: 'maria.garcia@cepcomunicacion.com' },
  },
  sort: '-createdAt',
});
```

---

### 7. Count Operations by Action Type (Analytics)

```typescript
// Note: Payload does not have native aggregation, use raw SQL for counts

import { pool } from '../db'; // PostgreSQL connection pool

const actionCounts = await pool.query(`
  SELECT action, COUNT(*) as count
  FROM audit_logs
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY action
  ORDER BY count DESC;
`);

// Result:
// [
//   { action: 'read', count: 15234 },
//   { action: 'update', count: 3421 },
//   { action: 'create', count: 1203 },
//   { action: 'delete', count: 45 },
// ]
```

---

## Integration Guide

### How to Create Audit Logs from Other Collections

**Step 1:** Add `afterChange` hook to your collection.

**Step 2:** Create audit log entry in hook.

**Example: Students Collection**

**File:** `/collections/Students/hooks/auditStudentChanges.ts`

```typescript
import type { CollectionAfterChangeHook } from 'payload';

export const auditStudentChanges: CollectionAfterChangeHook = async ({
  doc, // New document state
  req, // Request object (includes user, payload)
  operation, // 'create' | 'update'
  previousDoc, // Previous document state (only on update)
}) => {
  const { payload, user } = req;

  // Skip if no user (shouldn't happen, but safety check)
  if (!user) return;

  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: operation, // 'create' or 'update'
        collection_name: 'students',
        document_id: doc.id,
        user_id: user.id,
        // user_email, user_role, ip_address, user_agent auto-populated by hooks
        changes: operation === 'update' ? { before: previousDoc, after: doc } : null,
        status: 'success',
      },
    });
  } catch (error) {
    // Log error but do not block student creation/update
    payload.logger.error('[Student] Failed to create audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      studentId: doc.id,
      operation,
    });
  }
};
```

**Step 3:** Register hook in collection config.

```typescript
// Students.ts
export const Students: CollectionConfig = {
  // ... other config
  hooks: {
    afterChange: [
      auditStudentChanges, // Create audit log after student changes
    ],
  },
};
```

---

### Example: Audit Delete Operations

```typescript
export const auditStudentDeletion: CollectionAfterDeleteHook = async ({
  req,
  doc, // Deleted document
}) => {
  const { payload, user } = req;
  if (!user) return;

  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'delete',
        collection_name: 'students',
        document_id: doc.id,
        user_id: user.id,
        changes: { before: doc, after: null }, // Document no longer exists
        status: 'success',
      },
    });
  } catch (error) {
    payload.logger.error('[Student] Failed to create deletion audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
```

---

### Example: Audit Login Events

```typescript
// In User authentication hook
export const auditUserLogin: CollectionAfterLoginHook = async ({ req, user }) => {
  const { payload } = req;

  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'login',
        collection_name: 'users',
        document_id: user.id,
        user_id: user.id,
        status: 'success',
      },
    });
  } catch (error) {
    payload.logger.error('[User] Failed to create login audit log');
  }
};
```

---

## Performance Optimization

### Strategic Indexes

The AuditLogs collection has **5 critical indexes** for fast queries:

**1. Index on `user_id` (Foreign Key + Frequent Filter)**
```sql
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
```
**Use Case:** "Show all actions by this user"

---

**2. Index on `collection_name` (Frequent Filter)**
```sql
CREATE INDEX audit_logs_collection_name_idx ON audit_logs(collection_name);
```
**Use Case:** "Show all logs for Students collection"

---

**3. Index on `action` (Compliance Queries)**
```sql
CREATE INDEX audit_logs_action_idx ON audit_logs(action);
```
**Use Case:** "Show all delete operations" (GDPR compliance reports)

---

**4. Composite Index on `created_at` + `user_id` (Date Range Queries)**
```sql
CREATE INDEX audit_logs_created_at_user_idx ON audit_logs(created_at DESC, user_id);
```
**Use Case:** "Show user activity in date range" (accounting, compliance)

---

**5. Composite Index on `ip_address` + `created_at` (Security Investigations)**
```sql
CREATE INDEX audit_logs_ip_address_created_at_idx ON audit_logs(ip_address, created_at DESC);
```
**Use Case:** "Show all actions from this IP in last 7 days" (threat detection)

---

### Query Performance Tips

**DO:**
- ✅ Use indexed fields in WHERE clauses (`user_id`, `collection_name`, `action`, `ip_address`, `created_at`)
- ✅ Add date range filters to limit result sets
- ✅ Use pagination (`limit`, `page`) for large datasets
- ✅ Sort by indexed fields (`-createdAt` is fastest)

**DON'T:**
- ❌ Query by `user_agent` (not indexed, full table scan)
- ❌ Query by `error_message` (not indexed, text search is slow)
- ❌ Fetch all logs without filters (millions of rows)
- ❌ Use `changes` field in WHERE clause (JSON queries are slow)

---

### Scalability Considerations

**Expected Growth:**
- **Small System:** ~10K logs/month (120K/year)
- **Medium System:** ~100K logs/month (1.2M/year)
- **Large System:** ~1M logs/month (12M/year)

**7-Year Retention:**
- Small: ~840K rows
- Medium: ~8.4M rows
- Large: ~84M rows

**PostgreSQL Performance:**
- Well-indexed table can handle **100M+ rows** efficiently
- Keep hot data (last 90 days) in partition for faster queries (future enhancement)
- Archive old logs (7+ years) to cold storage or delete (Admin operation)

---

## Security Considerations

### 1. Immutability (SP-001: Defense in Depth)

**Why Immutable?**
Audit logs are legal evidence. Allowing updates would:
- Enable covering up malicious activity
- Invalidate compliance certifications (SOC2, ISO 27001)
- Violate GDPR Article 30 (reliable records requirement)
- Undermine forensic investigations

**Four Layers of Defense:**
1. **UI Layer:** `admin.readOnly = true` (prevents accidental edits)
2. **API Layer:** `access.update = () => false` (blocks API updates)
3. **Hook Layer:** `preventAuditLogUpdates` throws error
4. **Database Layer:** (Future) PostgreSQL trigger prevents updates

**Testing Immutability:**
```typescript
// Test: Attempt to update audit log (MUST FAIL)
await expect(
  payload.update({
    collection: 'audit-logs',
    id: auditLogId,
    data: { status: 'success' },
  })
).rejects.toThrow('Audit logs are immutable');
```

---

### 2. PII Protection (SP-004)

**PII Fields in AuditLogs:**
- `ip_address` - Personally identifiable under GDPR
- `user_email` - Obvious PII
- `changes` - May contain PII depending on logged operation
- `metadata` - May contain PII (headers, referer)

**Protection Measures:**
- **Field-level access control:** Only Admin and Gestor can read PII fields
- **No PII logging in hooks:** Hooks never log emails, IPs, names (only IDs and booleans)
- **Sanitization:** Passwords, tokens, secrets removed from changes object
- **Retention limits:** Admin can delete logs (GDPR right to erasure)

**Testing PII Access:**
```typescript
// Test: Marketing role cannot read ip_address field
const log = await payload.findByID({
  collection: 'audit-logs',
  id: auditLogId,
  user: marketingUser,
});

expect(log.ip_address).toBeUndefined(); // Field should be hidden
```

---

### 3. Access Control Bypass Prevention

**Risk:** Admin operations can bypass `access` functions.

**Mitigation:**
- `preventAuditLogUpdates` hook runs **after** access control
- Hook throws error even if access check passed
- Triple validation ensures no updates slip through

**Testing:**
```typescript
// Test: Even Admin cannot update audit log via admin API bypass
await expect(
  payload.update({
    collection: 'audit-logs',
    id: auditLogId,
    data: { status: 'failure' },
    overrideAccess: true, // Admin bypass flag
  })
).rejects.toThrow('immutable');
```

---

### 4. SQL Injection Prevention

**Risk:** `document_id` field accepts arbitrary strings (not just UUIDs).

**Mitigation:**
- Payload uses parameterized queries (Drizzle ORM)
- No raw SQL with user input
- All queries are SQL-injection safe by design

**No Manual Escaping Needed:**
Drizzle ORM handles escaping automatically.

---

## Retention Policy

### Legal Requirements (Spain)

**Retention Period:** **7 years** from date of creation

**Legal Basis:**
- Ley General Tributaria (Tax Law) - Article 70
- Reglamento General de Protección de Datos (RGPD) - Article 30

**After 7 Years:**
- Admin can delete old logs manually
- (Future) Automated cleanup job deletes logs older than 7 years

---

### Right to Erasure (GDPR Article 17)

**When a user exercises "right to be forgotten":**

**Step 1:** Admin verifies identity and request legitimacy
**Step 2:** Admin deletes user data from all collections (Users, Students, Leads, etc.)
**Step 3:** Admin deletes audit logs containing user's PII:

```typescript
// Delete all audit logs for erased user
await payload.delete({
  collection: 'audit-logs',
  where: {
    user_id: { equals: erasedUserId },
  },
});
```

**Step 4:** System creates audit log of the erasure operation:

```typescript
await payload.create({
  collection: 'audit-logs',
  data: {
    action: 'delete',
    collection_name: 'users',
    document_id: erasedUserId,
    user_id: adminUserId, // Who performed erasure
    status: 'success',
    metadata: {
      reason: 'GDPR Article 17: Right to erasure request',
      request_date: '2025-10-31',
      verified_by: 'admin@cepcomunicacion.com',
    },
  },
});
```

**Step 5:** Erasure audit log retained for 7 years as legal evidence.

---

### Automated Cleanup (Future Enhancement)

**BullMQ Job:** `cleanupOldAuditLogs`

**Schedule:** Monthly (1st of month at 2 AM)

**Logic:**
```typescript
const sevenYearsAgo = new Date();
sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

const deleted = await payload.delete({
  collection: 'audit-logs',
  where: {
    createdAt: {
      less_than: sevenYearsAgo.toISOString(),
    },
  },
});

console.log(`Deleted ${deleted.docs.length} audit logs older than 7 years`);
```

---

## Troubleshooting

### Issue: IP Address is 127.0.0.1 (Localhost)

**Symptom:** All audit logs show `ip_address: "127.0.0.1"`

**Cause:** Application not behind proxy, or headers not configured

**Solution:**

**If behind Nginx/Apache reverse proxy:**
```nginx
# Nginx config
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Real-IP $remote_addr;
```

**If behind load balancer (AWS, Cloudflare):**
- Check `X-Forwarded-For` header is passed through
- Verify IP extraction in `extractIPAddress()` function

**Development/Testing:**
- Localhost is expected (not an error)
- Test with actual client requests, not Postman/curl from same machine

---

### Issue: Audit Logs Not Created Automatically

**Symptom:** Operations succeed but no audit log entries

**Cause:** `afterChange` hook not implemented in collection

**Solution:**

1. **Check if collection has audit hook:**
   ```bash
   grep -r "auditChanges" apps/cms/src/collections/Students/
   ```

2. **Implement audit hook** (see Integration Guide above)

3. **Verify hook is registered:**
   ```typescript
   // Students.ts
   hooks: {
     afterChange: [
       auditStudentChanges, // Must be in array
     ],
   }
   ```

4. **Check for errors in logs:**
   ```bash
   tail -f logs/payload.log | grep "Failed to create audit log"
   ```

---

### Issue: Cannot Update Audit Log (Expected Behavior)

**Symptom:** Update operation fails with error: "Audit logs are immutable"

**Cause:** This is expected behavior (not a bug)

**Solution:**
- Audit logs CANNOT be updated by design (GDPR compliance)
- If correction needed, CREATE new audit log with correction metadata
- Reference original log ID in new log's `metadata` field

**Example Correction:**
```typescript
await payload.create({
  collection: 'audit-logs',
  data: {
    action: 'update',
    collection_name: 'students',
    document_id: studentId,
    user_id: adminUserId,
    status: 'success',
    metadata: {
      correction: true,
      original_log_id: incorrectLogId,
      reason: 'Original log had incorrect collection_name',
    },
  },
});
```

---

### Issue: "Invalid collection_name" Error

**Symptom:** Audit log creation fails with validation error

**Cause:** `collection_name` value does not match any Payload collection slug

**Solution:**

1. **Check valid collection names in schemas.ts:**
   ```typescript
   export const VALID_COLLECTION_NAMES = [
     'users', 'cycles', 'campuses', ...
   ];
   ```

2. **Use exact slug (kebab-case):**
   - ✅ `'course-runs'`
   - ❌ `'courseRuns'`
   - ❌ `'CourseRuns'`

3. **If new collection added, update VALID_COLLECTION_NAMES array**

---

### Issue: Marketing/Asesor Cannot See Audit Logs

**Symptom:** Role can authenticate but sees empty audit logs list

**Cause:** Query constraint limits logs to user's own actions

**Expected Behavior:**
- Marketing/Asesor can ONLY see logs where `user_id = their own ID`
- This is correct (Principle of Least Privilege)

**Verify:**
```typescript
const myLogs = await payload.find({
  collection: 'audit-logs',
  user: marketingUser,
});

// Should only return logs where user_id = marketingUser.id
```

**If user needs to see all logs:** Promote to Gestor or Admin role.

---

### Issue: Large Database Size

**Symptom:** `audit_logs` table is multiple GB

**Cause:** High-volume operations (millions of logs)

**Solutions:**

**1. Partition table by date (PostgreSQL 10+):**
```sql
CREATE TABLE audit_logs_2025_q1 PARTITION OF audit_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
```

**2. Archive old logs to S3/Glacier:**
```typescript
// Export logs older than 1 year to JSON
const oldLogs = await payload.find({
  collection: 'audit-logs',
  where: {
    createdAt: {
      less_than: oneYearAgo.toISOString(),
    },
  },
  limit: 10000,
});

// Upload to S3, then delete from database
```

**3. Delete logs older than 7 years:**
```typescript
// Admin operation (GDPR compliant)
await payload.delete({
  collection: 'audit-logs',
  where: {
    createdAt: {
      less_than: sevenYearsAgo.toISOString(),
    },
  },
});
```

---

## Additional Resources

- **GDPR Full Text:** https://gdpr-info.eu/
- **Article 30 Explanation:** https://gdpr-info.eu/art-30-gdpr/
- **Spanish Data Protection Authority:** https://www.aepd.es/
- **Payload CMS Access Control Docs:** https://payloadcms.com/docs/access-control
- **PostgreSQL Index Best Practices:** https://www.postgresql.org/docs/current/indexes.html

---

**Last Updated:** 2025-10-31
**Maintained By:** SOLARIA AGENCY - Backend Team
**Questions?** Contact: dev@solaria.agency

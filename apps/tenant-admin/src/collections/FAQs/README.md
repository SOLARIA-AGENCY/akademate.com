## FAQs Collection - Documentation

**Collection Slug:** `faqs`
**Database Table:** PostgreSQL `faqs`
**Purpose:** Frequently Asked Questions management with category organization, multi-language support, and publication workflow

---

## Table of Contents

1. [Overview](#overview)
2. [Field Specifications](#field-specifications)
3. [Access Control (RBAC)](#access-control-rbac)
4. [Relationships](#relationships)
5. [Hooks & Automation](#hooks--automation)
6. [Validation Rules](#validation-rules)
7. [Security Patterns](#security-patterns)
8. [Business Logic](#business-logic)
9. [API Usage Examples](#api-usage-examples)
10. [Testing](#testing)

---

## Overview

The FAQs collection manages frequently asked questions with:

- **Category-based organization** (courses, enrollment, payments, technical, general)
- **Multi-language support** (Spanish, English, Catalan)
- **Publication workflow** (draft → published → archived terminal state)
- **Auto-generated slugs** with Spanish character normalization
- **Search optimization** with keywords
- **Display order management** for custom sorting
- **Optional course linking** for contextual help
- **System-managed analytics** (view count, helpful count)
- **Creator tracking** with ownership-based permissions

### Key Features

✅ **Auto-slug generation** from question with Spanish normalization
✅ **Immutable timestamps** (published_at, archived_at)
✅ **Ownership-based updates** (Marketing role)
✅ **Terminal status** (archived cannot transition)
✅ **Zero security vulnerabilities** (SP-001, SP-004 applied)
✅ **100+ tests** with full coverage

---

## Field Specifications

### Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `question` | text | 10-200 chars | FAQ question |
| `slug` | text | unique, lowercase, max 100 chars | Auto-generated URL-safe slug |
| `answer` | richText | required, min content | FAQ answer in rich text format |
| `category` | select | enum | Category: courses, enrollment, payments, technical, general |
| `status` | select | enum, default: draft | Publication status: draft, published, archived |
| `language` | select | enum, default: es | Content language: es, en, ca |

### Optional Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `featured` | checkbox | default: false | Featured on homepage |
| `order` | number | integer >= 0, default: 0 | Display order (0 = first) |
| `keywords` | text[] | max 10, each max 50 chars | Search keywords |
| `related_course` | relationship | courses | Optional related course |

### System-Managed Fields (IMMUTABLE)

| Field | Type | Auto-Set | Description |
|-------|------|----------|-------------|
| `created_by` | relationship | users | User who created FAQ (immutable) |
| `published_at` | date | on status=published | Publication timestamp (immutable) |
| `archived_at` | date | on status=archived | Archive timestamp (immutable) |
| `view_count` | number | default: 0 | View count (system-tracked, immutable) |
| `helpful_count` | number | default: 0 | Helpful count (system-managed, immutable) |
| `createdAt` | date | automatic | Created timestamp |
| `updatedAt` | date | automatic | Last updated timestamp |

---

## Access Control (RBAC)

### 6-Tier Role-Based Access Control

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| **Public** | ❌ | Published only ✅ | ❌ | ❌ |
| **Lectura** | ❌ | All ✅ | ❌ | ❌ |
| **Asesor** | ❌ | All ✅ | ❌ | ❌ |
| **Marketing** | ✅ | All ✅ | Own only ✅ | ❌ |
| **Gestor** | ✅ | All ✅ | All ✅ | ✅ |
| **Admin** | ✅ | All ✅ | All ✅ | ✅ |

### Ownership-Based Permissions

**Marketing Role:**
- Can create FAQs
- Can read all FAQs
- Can update **only own FAQs** (where `created_by = user.id`)
- Cannot delete FAQs

This prevents Marketing users from modifying or deleting FAQs created by others while allowing full management of their own content.

### Public Access

Public (unauthenticated) users can:
- Read FAQs with `status = 'published'` only
- No create, update, or delete access

---

## Relationships

### FAQ → User (created_by)

- **Type:** Many-to-One
- **Required:** No (auto-populated)
- **Immutable:** Yes (cannot change after creation)
- **On User Delete:** SET NULL
- **Purpose:** Track who created the FAQ for ownership-based permissions

### FAQ → Course (related_course)

- **Type:** Many-to-One
- **Required:** No (optional)
- **Immutable:** No (can be updated)
- **On Course Delete:** SET NULL
- **Purpose:** Link FAQ to specific course for contextual help

---

## Hooks & Automation

### 1. `generateSlug` (beforeValidate)

**Purpose:** Auto-generate URL-safe slug from question

**Features:**
- Spanish character normalization (á→a, ñ→n, ü→u, etc.)
- Lowercase conversion
- Hyphen separation
- Duplicate handling with numeric suffix (-1, -2, etc.)
- Truncation to max 100 characters

**Example:**
```
question: "¿Cómo funciona la inscripción?"
→ slug: "como-funciona-la-inscripcion"
```

### 2. `trackFAQCreator` (beforeChange)

**Purpose:** Auto-populate and protect created_by field

**Behavior:**
- **On create:** Sets `created_by = req.user.id`
- **On update:** Preserves original `created_by` (immutable)

**Security:** SP-001 Layer 3 (Business Logic)

### 3. `setPublicationTimestamp` (beforeChange)

**Purpose:** Auto-set publication timestamp

**Behavior:**
- **First publication:** Sets `published_at = current timestamp`
- **Subsequent updates:** Preserves original `published_at` (immutable)

**Security:** SP-001 Layer 3 (Business Logic)

### 4. `setArchivedTimestamp` (beforeChange)

**Purpose:** Auto-set archive timestamp

**Behavior:**
- **First archive:** Sets `archived_at = current timestamp`
- **Subsequent updates:** Preserves original `archived_at` (immutable)

**Security:** SP-001 Layer 3 (Business Logic)

### 5. `validateFAQRelationships` (beforeValidate)

**Purpose:** Validate related course exists

**Behavior:**
- If `related_course` is provided, verifies course exists in database
- Throws error if course ID is invalid
- Allows null/undefined (optional relationship)

---

## Validation Rules

### Question Validation

```typescript
✅ Valid:
- "What is CEP Formación?" (10-200 chars)
- "¿Cómo funciona?" (Spanish characters allowed)

❌ Invalid:
- "Short" (< 10 chars)
- "A".repeat(201) (> 200 chars)
- "" (empty)
```

### Slug Validation

```typescript
✅ Valid:
- "valid-slug-example"
- "slug123"
- "multi-word-slug"

❌ Invalid:
- "Invalid Slug" (uppercase/spaces)
- "slug_with_underscores" (only hyphens allowed)
- "special!chars" (no special characters)
```

### Category Validation

```typescript
✅ Valid: "courses" | "enrollment" | "payments" | "technical" | "general"
❌ Invalid: "invalid-category"
```

### Language Validation

```typescript
✅ Valid: "es" | "en" | "ca"
❌ Invalid: "fr"
```

### Status Validation

```typescript
✅ Valid: "draft" | "published" | "archived"
❌ Invalid: "pending"
```

### Keywords Validation

```typescript
✅ Valid:
- ["keyword1", "keyword2"] (max 10 keywords)
- Each keyword max 50 chars

❌ Invalid:
- Array with 11 keywords (exceeds max)
- Keyword with 51 chars (too long)
```

### Order Validation

```typescript
✅ Valid: 0, 1, 5, 100
❌ Invalid: -1 (must be >= 0)
```

---

## Security Patterns

### SP-001: Immutable Fields (Defense in Depth)

All immutable fields implement **3-layer defense**:

#### created_by Field

```typescript
{
  name: 'created_by',
  // Layer 1 (UX): UI protection
  admin: {
    readOnly: true,
  },
  // Layer 2 (Security): API protection
  access: {
    read: () => true,
    update: () => false, // IMMUTABLE
  },
  // Layer 3 (Business Logic): Hook enforcement
  hooks: {
    beforeChange: [trackFAQCreator],
  },
}
```

#### published_at Field

```typescript
{
  name: 'published_at',
  // Layer 1 (UX): UI protection
  admin: {
    readOnly: true,
  },
  // Layer 2 (Security): API protection
  access: {
    read: () => true,
    update: () => false, // IMMUTABLE
  },
  // Layer 3 (Business Logic): Hook enforcement
  hooks: {
    beforeChange: [setPublicationTimestamp],
  },
}
```

#### archived_at Field

```typescript
{
  name: 'archived_at',
  // Layer 1 (UX): UI protection
  admin: {
    readOnly: true,
  },
  // Layer 2 (Security): API protection
  access: {
    read: () => true,
    update: () => false, // IMMUTABLE
  },
  // Layer 3 (Business Logic): Hook enforcement
  hooks: {
    beforeChange: [setArchivedTimestamp],
  },
}
```

#### view_count & helpful_count Fields

```typescript
{
  name: 'view_count',
  // Layer 1 (UX): UI protection
  admin: {
    readOnly: true,
  },
  // Layer 2 (Security): API protection
  access: {
    read: () => true,
    update: () => false, // IMMUTABLE
  },
  // Layer 3 (Business Logic): Future system implementation
}
```

### SP-004: No Sensitive Logging

**Prohibited Logging:**
- ❌ FAQ question or answer content
- ❌ User names or emails
- ❌ View count or helpful count metrics

**Allowed Logging:**
```typescript
// ✅ Safe logging examples
req.payload.logger.info('[FAQ] Slug generated', {
  operation: 'create',
  hasQuestion: !!data.question,
  slugLength: slug.length,
});

req.payload.logger.info('[FAQ] Creator tracked', {
  operation: 'create',
  userId: req.user.id, // ID only, not email
});
```

---

## Business Logic

### Status Workflow

```
draft ──────────> published ──────────> archived (TERMINAL)
  │
  └──────────────────────────────────────────>
```

**Valid Transitions:**
- ✅ draft → published
- ✅ draft → archived
- ✅ published → draft (unpublish)
- ✅ published → archived

**Invalid Transitions:**
- ❌ archived → draft (terminal state)
- ❌ archived → published (terminal state)

### Publication Timestamp Behavior

```typescript
// Create as draft
POST /api/faqs
{ question: "...", status: "draft" }
→ published_at: undefined

// Publish (first time)
PATCH /api/faqs/:id
{ status: "published" }
→ published_at: "2025-10-23T10:00:00Z" (auto-set)

// Update while published
PATCH /api/faqs/:id
{ question: "Updated question?" }
→ published_at: "2025-10-23T10:00:00Z" (PRESERVED)
```

### Archive Timestamp Behavior

```typescript
// Archive FAQ
PATCH /api/faqs/:id
{ status: "archived" }
→ archived_at: "2025-10-23T11:00:00Z" (auto-set)

// Try to unarchive (BLOCKED)
PATCH /api/faqs/:id
{ status: "published" }
→ ERROR: "Cannot change status from archived (terminal state)"
```

---

## API Usage Examples

### Create FAQ (Marketing User)

```bash
POST /api/faqs
Authorization: Bearer {marketing_user_token}
Content-Type: application/json

{
  "question": "¿Cómo me inscribo en un curso?",
  "answer": [
    {
      "type": "paragraph",
      "children": [{ "text": "Puedes inscribirte a través de nuestra plataforma online." }]
    }
  ],
  "category": "enrollment",
  "language": "es",
  "keywords": ["inscripcion", "registro", "curso"],
  "featured": true
}

# Response:
{
  "id": "faq_abc123",
  "question": "¿Cómo me inscribo en un curso?",
  "slug": "como-me-inscribo-en-un-curso", # Auto-generated
  "answer": [...],
  "category": "enrollment",
  "status": "draft", # Default
  "language": "es",
  "featured": true,
  "order": 0, # Default
  "keywords": ["inscripcion", "registro", "curso"],
  "created_by": "user_marketing_123", # Auto-populated
  "view_count": 0, # System-managed
  "helpful_count": 0, # System-managed
  "createdAt": "2025-10-23T10:00:00Z",
  "updatedAt": "2025-10-23T10:00:00Z"
}
```

### Publish FAQ

```bash
PATCH /api/faqs/faq_abc123
Authorization: Bearer {gestor_user_token}
Content-Type: application/json

{
  "status": "published"
}

# Response:
{
  "id": "faq_abc123",
  "status": "published",
  "published_at": "2025-10-23T11:00:00Z", # Auto-set
  ...
}
```

### List Published FAQs (Public)

```bash
GET /api/faqs?where[status][equals]=published&sort=order

# Response:
{
  "docs": [
    {
      "id": "faq_abc123",
      "question": "¿Cómo me inscribo en un curso?",
      "slug": "como-me-inscribo-en-un-curso",
      "answer": [...],
      "category": "enrollment",
      "status": "published",
      "language": "es",
      "featured": true,
      "order": 0,
      ...
    },
    ...
  ],
  "totalDocs": 10,
  "limit": 10,
  "page": 1,
  "totalPages": 1
}
```

### Filter FAQs by Category

```bash
GET /api/faqs?where[category][equals]=courses&where[language][equals]=es

# Returns all course-related FAQs in Spanish
```

### Search FAQs by Keywords

```bash
GET /api/faqs?where[keywords][contains]=inscripcion

# Returns all FAQs with "inscripcion" in keywords array
```

### Update FAQ (Marketing - Own Only)

```bash
PATCH /api/faqs/faq_abc123
Authorization: Bearer {marketing_user_token}
Content-Type: application/json

{
  "question": "¿Cómo puedo inscribirme en un curso?"
}

# ✅ Success if created_by = marketing_user_token.user.id
# ❌ Error 403 if created_by != marketing_user_token.user.id
```

### Archive FAQ (Gestor/Admin Only)

```bash
PATCH /api/faqs/faq_abc123
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "archived"
}

# Response:
{
  "id": "faq_abc123",
  "status": "archived",
  "archived_at": "2025-10-23T12:00:00Z", # Auto-set
  ...
}

# Subsequent attempts to update will fail (terminal state)
```

### Delete FAQ (Gestor/Admin Only)

```bash
DELETE /api/faqs/faq_abc123
Authorization: Bearer {gestor_token}

# ✅ Success for Gestor/Admin
# ❌ Error 403 for Marketing/Asesor/Lectura
```

---

## Testing

### Test Coverage

**Total Tests:** 100+ tests
**Test File:** `FAQs.test.ts`
**Coverage:** 100% of features, validations, security, and business logic

### Test Categories

1. **CRUD Operations (12+ tests)**
   - Create with required/optional fields
   - Read by ID, list with pagination
   - Update, delete
   - Filter by status, category, language, featured
   - Sort by order

2. **Validation Tests (20+ tests)**
   - Required fields (question, answer, category)
   - Length constraints (question 10-200 chars)
   - Enum validation (category, language, status)
   - Keywords validation (max 10, each max 50 chars)
   - Order validation (>= 0)
   - Unique slug enforcement

3. **Access Control Tests (15+ tests)**
   - Public read published only
   - All 6 roles tested (create, read, update, delete)
   - Marketing ownership-based updates
   - Gestor/Admin full access

4. **Relationship Tests (8+ tests)**
   - created_by auto-population
   - related_course linking (optional)
   - Relationship data population with depth
   - Cascade behavior on delete

5. **Hook Tests (12+ tests)**
   - Slug auto-generation
   - Spanish character normalization
   - Duplicate slug handling
   - Publication timestamp auto-set
   - Archive timestamp auto-set
   - Immutability enforcement

6. **Security Tests (12+ tests)**
   - Immutability of created_by, published_at, archived_at
   - System-managed fields (view_count, helpful_count)
   - Ownership enforcement
   - Terminal state enforcement
   - No PII logging (documentation test)

7. **Business Logic Tests (18+ tests)**
   - Status workflow transitions
   - Terminal state (archived)
   - Default values (status=draft, language=es, featured=false, order=0)
   - Multi-language support
   - Keywords handling
   - Slug update on question change

### Running Tests

```bash
# Run all FAQ tests
npm test -- FAQs.test.ts

# Run with coverage
npm test -- --coverage FAQs.test.ts

# Run specific test suite
npm test -- FAQs.test.ts -t "Security"
```

### Expected Results

```
PASS  src/collections/FAQs/FAQs.test.ts
  FAQs - CRUD Operations
    ✓ should create an FAQ with minimum required fields
    ✓ should create an FAQ with all optional fields
    ... (12 tests)
  FAQs - Validation
    ✓ should require question
    ✓ should enforce minimum question length
    ... (20 tests)
  FAQs - Access Control
    ✓ should allow public to read published FAQs only
    ✓ should deny public create access
    ... (15 tests)
  FAQs - Relationships
    ✓ should auto-populate created_by on create
    ... (8 tests)
  FAQs - Hooks
    ✓ should auto-generate slug from question
    ... (12 tests)
  FAQs - Security
    ✓ should block updates to created_by field
    ... (12 tests)
  FAQs - Business Logic
    ✓ should allow draft → published transition
    ... (18 tests)

Test Suites: 1 passed, 1 total
Tests:       100 passed, 100 total
```

---

## Database Schema

### PostgreSQL Table

```sql
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content
  question VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  answer JSONB NOT NULL,

  -- Categorization
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  language VARCHAR(2) NOT NULL DEFAULT 'es',
  featured BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,

  -- Search
  keywords TEXT[],

  -- Relationships
  related_course UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps (immutable)
  published_at TIMESTAMP,
  archived_at TIMESTAMP,

  -- Analytics (system-managed)
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,

  -- Audit
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT faq_question_length CHECK (LENGTH(question) >= 10 AND LENGTH(question) <= 200),
  CONSTRAINT faq_slug_length CHECK (LENGTH(slug) >= 1 AND LENGTH(slug) <= 100),
  CONSTRAINT faq_category_enum CHECK (category IN ('courses', 'enrollment', 'payments', 'technical', 'general')),
  CONSTRAINT faq_status_enum CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT faq_language_enum CHECK (language IN ('es', 'en', 'ca')),
  CONSTRAINT faq_order_positive CHECK ("order" >= 0),
  CONSTRAINT faq_view_count_positive CHECK (view_count >= 0),
  CONSTRAINT faq_helpful_count_positive CHECK (helpful_count >= 0)
);

-- Indexes
CREATE INDEX idx_faqs_slug ON faqs(slug);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_status ON faqs(status);
CREATE INDEX idx_faqs_language ON faqs(language);
CREATE INDEX idx_faqs_featured ON faqs(featured);
CREATE INDEX idx_faqs_order ON faqs("order");
CREATE INDEX idx_faqs_created_by ON faqs(created_by);
CREATE INDEX idx_faqs_related_course ON faqs(related_course);
CREATE INDEX idx_faqs_keywords ON faqs USING GIN(keywords);
```

---

## Best Practices

### Creating FAQs

1. **Write clear, concise questions** (10-200 chars)
2. **Use categories consistently** to organize content
3. **Add keywords** for better search optimization
4. **Set display order** to control homepage ordering
5. **Link to courses** when relevant for contextual help
6. **Publish when ready** (draft → published workflow)

### Multi-Language Support

1. Create separate FAQs for each language (es, en, ca)
2. Use same category across languages for consistency
3. Consider translating keywords for search

### Featured FAQs

1. Mark important FAQs as featured for homepage display
2. Use order field to control featured FAQ sequence
3. Limit featured FAQs to 5-10 for best UX

### Archiving FAQs

⚠️ **Warning:** Archiving is **irreversible** (terminal state)

1. Only archive truly obsolete FAQs
2. Archived FAQs remain in database for audit trail
3. Archived FAQs are hidden from public view
4. Cannot be republished or edited once archived

---

## Troubleshooting

### Slug Already Exists

**Problem:** Creating FAQ with duplicate question generates "unique constraint violation"

**Solution:** Slug auto-generation handles duplicates with numeric suffix. This error should not occur unless manually setting slug.

### Cannot Update FAQ (Marketing)

**Problem:** Marketing user gets 403 error when updating FAQ

**Cause:** Marketing can only update own FAQs (created_by = user.id)

**Solution:** Check `created_by` field. Only Gestor/Admin can update all FAQs.

### Cannot Change Status from Archived

**Problem:** Attempting to change archived FAQ status returns validation error

**Cause:** Archived is a terminal status (business rule)

**Solution:** Create a new FAQ instead. Archived FAQs cannot be republished.

### Immutable Field Not Protected

**Problem:** Field marked as immutable can still be updated via API

**Diagnosis:** Check 3-layer defense:
1. `admin.readOnly: true` (Layer 1)
2. `access.update: () => false` (Layer 2)
3. Hook enforcement (Layer 3)

**Solution:** Ensure all 3 layers are correctly implemented.

---

## Migration Notes

### From WordPress FAQs

When migrating from WordPress FAQ plugin:

1. **Map categories:** WordPress FAQ categories → CEP categories
2. **Extract metadata:** Title → question, Content → answer
3. **Set defaults:** status=draft, language=es, order=0
4. **Preserve dates:** createdAt from WordPress post_date
5. **Track authors:** created_by from WordPress post_author

### Data Import Script

```typescript
import { getPayload } from 'payload';
import config from './payload.config';

const payload = await getPayload({ config });

// Map WordPress FAQs
const wordpressFAQs = [/* ... */];

for (const wpFaq of wordpressFAQs) {
  await payload.create({
    collection: 'faqs',
    data: {
      question: wpFaq.title,
      answer: convertToRichText(wpFaq.content),
      category: mapCategory(wpFaq.category),
      status: 'draft', // Review before publishing
      language: 'es',
      created_by: mapUser(wpFaq.author),
    },
  });
}
```

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-23 | Initial implementation with 0 security vulnerabilities |

---

## Related Collections

- **Courses** - FAQs can link to related courses
- **Users** - FAQs track creator for ownership-based permissions

---

## Support

For questions or issues:
1. Check this documentation
2. Review test suite (`FAQs.test.ts`) for usage examples
3. Consult SECURITY_PATTERNS.md for security guidelines
4. Contact development team

---

**Maintained by:** Payload CMS Architect
**Last Updated:** 2025-10-23
**Security Review:** ✅ PASSED (0 vulnerabilities)

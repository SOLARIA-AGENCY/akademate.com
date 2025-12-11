# BlogPosts Collection

**Collection #11 of 13** | **Status:** Production-Ready ✅ | **Security Review:** Passed ✅

## Overview

The BlogPosts collection manages blog content with SEO optimization, publication workflows, author tracking, and related course linking for CEPComunicación v2.

**Key Features:**
- Rich text blog content with auto-generated slugs (Spanish character normalization)
- Publication workflow: draft → published → archived (terminal state)
- SEO optimization (meta_title, meta_description, og_image)
- Author ownership tracking with immutable fields
- Related courses (max 5 per post)
- Auto-calculated read time estimation
- View count tracking (system-managed)
- Multi-language support (es, en, ca)
- Featured posts flag for homepage

## Table of Contents

1. [Database Schema](#database-schema)
2. [Field Specifications](#field-specifications)
3. [Access Control (6-Tier RBAC)](#access-control-6-tier-rbac)
4. [Relationships](#relationships)
5. [Hooks & Business Logic](#hooks--business-logic)
6. [Security Patterns Applied](#security-patterns-applied)
7. [API Usage Examples](#api-usage-examples)
8. [Validation Rules](#validation-rules)
9. [Status Workflow](#status-workflow)
10. [Testing](#testing)

---

## Database Schema

**PostgreSQL Table:** `blog_posts`

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Post Identification
  title VARCHAR(120) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  excerpt TEXT NOT NULL CHECK (char_length(excerpt) BETWEEN 50 AND 300),
  content JSONB NOT NULL,

  -- Assets
  featured_image VARCHAR(500),
  og_image VARCHAR(500),

  -- Publication Workflow
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  archived_at TIMESTAMP,

  -- Author & Ownership
  author UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Tags
  tags TEXT[],

  -- Related Content
  related_courses UUID[] REFERENCES courses(id)[],

  -- Analytics
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  estimated_read_time INTEGER CHECK (estimated_read_time >= 1),

  -- SEO
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),

  -- Language
  language VARCHAR(2) NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en', 'ca')),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_author ON blog_posts(author);
CREATE INDEX idx_blog_posts_language ON blog_posts(language);
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured);
```

**Total Fields:** 20

---

## Field Specifications

### 1. Post Identification

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **title** | text | ✅ Yes | 10-120 chars | Blog post title |
| **slug** | text | ✅ Yes | Unique, lowercase, hyphens | Auto-generated from title with Spanish normalization |
| **excerpt** | textarea | ✅ Yes | 50-300 chars | Preview excerpt for listings |
| **content** | richText | ✅ Yes | Array of nodes | Main blog content (rich text) |

### 2. Assets

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **featured_image** | text | ❌ No | URL format, security checks | Featured image URL |
| **og_image** | text | ❌ No | URL format, security checks | Open Graph image for social sharing |

### 3. Publication Workflow

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **status** | select | ✅ Yes | draft, published, archived | Publication status with workflow |
| **featured** | checkbox | ❌ No | Boolean | Featured on homepage flag |
| **published_at** | date | ❌ No | Auto-set, immutable | First publication timestamp |
| **archived_at** | date | ❌ No | Auto-set, immutable | Archive timestamp |

### 4. Author & Ownership

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **author** | relationship | ✅ Yes | User exists, immutable | Post author (auto-populated) |
| **created_by** | relationship | ❌ No | User exists, immutable | User who created post (audit trail) |

### 5. Tags

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **tags** | text[] | ❌ No | Max 10, lowercase, alphanumeric + hyphens, max 30 chars each | Post tags for filtering |

### 6. Related Content

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **related_courses** | relationship[] | ❌ No | Max 5 courses, courses exist | Related courses |

### 7. Analytics

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **view_count** | number | ❌ No | >= 0, immutable | View count (system-managed) |
| **estimated_read_time** | number | ❌ No | >= 1, immutable | Estimated read time in minutes (auto-calculated) |

### 8. SEO Optimization

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **meta_title** | text | ❌ No | 50-70 chars | SEO meta title |
| **meta_description** | textarea | ❌ No | 120-160 chars | SEO meta description |

### 9. Language

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| **language** | select | ✅ Yes | es, en, ca | Content language (default: es) |

---

## Access Control (6-Tier RBAC)

### Summary Table

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| **Public** | ❌ | Published only | ❌ | ❌ |
| **Lectura** | ❌ | All | ❌ | ❌ |
| **Asesor** | ❌ | All | ❌ | ❌ |
| **Marketing** | ✅ | All | Own posts only | ❌ |
| **Gestor** | ✅ | All | All | ✅ |
| **Admin** | ✅ | All | All | ✅ |

### Detailed Rules

#### Public (Unauthenticated)
- **CREATE:** ❌ Denied
- **READ:** ✅ Published posts only (`status = 'published'`)
- **UPDATE:** ❌ Denied
- **DELETE:** ❌ Denied

#### Lectura Role
- **CREATE:** ❌ Denied
- **READ:** ✅ All posts (for internal review)
- **UPDATE:** ❌ Denied
- **DELETE:** ❌ Denied

#### Asesor Role
- **CREATE:** ❌ Denied
- **READ:** ✅ All posts (for reference)
- **UPDATE:** ❌ Denied
- **DELETE:** ❌ Denied

#### Marketing Role
- **CREATE:** ✅ Allowed (primary content creators)
- **READ:** ✅ All posts
- **UPDATE:** ✅ Own posts only (`author = user.id`)
- **DELETE:** ❌ Denied (use `status=archived` instead)

**Ownership Enforcement:**
- Marketing users can only update posts where `author = user.id`
- Prevents privilege escalation
- Enforced via query constraint: `{ author: { equals: user.id } }`

#### Gestor Role
- **CREATE:** ✅ Allowed
- **READ:** ✅ All posts
- **UPDATE:** ✅ All posts (can edit anyone's posts)
- **DELETE:** ✅ Allowed (hard delete)

#### Admin Role
- **CREATE:** ✅ Allowed
- **READ:** ✅ All posts
- **UPDATE:** ✅ All posts (can edit anyone's posts)
- **DELETE:** ✅ Allowed (hard delete)

---

## Relationships

### BlogPost → User (author)
- **Type:** Many-to-One
- **Required:** Yes
- **Auto-populated:** On create with `req.user.id`
- **Immutability:** IMMUTABLE (3-layer defense)
- **On Delete:** SET NULL
- **Purpose:** Track post authorship for ownership-based permissions

### BlogPost → User (created_by)
- **Type:** Many-to-One
- **Required:** No
- **Auto-populated:** On create with `req.user.id`
- **Immutability:** IMMUTABLE (3-layer defense)
- **On Delete:** SET NULL
- **Purpose:** Audit trail

### BlogPost ↔ Courses (related_courses)
- **Type:** Many-to-Many
- **Required:** No
- **Max Count:** 5 courses per post
- **Validation:** All course IDs must exist in database
- **On Delete:** Remove from array
- **Purpose:** Link blog posts to related courses

---

## Hooks & Business Logic

### 1. generateSlug (beforeValidate)

**Purpose:** Auto-generate URL-safe slug from title

**Process:**
1. Normalize Spanish characters (á→a, ñ→n, ü→u, etc.)
2. Convert to lowercase
3. Replace spaces and special characters with hyphens
4. Remove consecutive hyphens
5. Check for duplicates in database
6. If duplicate exists, append numeric suffix (-1, -2, etc.)

**Example:**
```typescript
title: "Educación Española: Niños y Jóvenes"
slug: "educacion-espanola-ninos-y-jovenes"

// If duplicate exists:
slug: "educacion-espanola-ninos-y-jovenes-1"
```

**Applied to:** `slug` field

### 2. trackBlogPostAuthor (beforeChange)

**Purpose:** Auto-populate and enforce immutability of `author` field

**Security Pattern:** SP-001 (Layer 3: Business Logic)

**Process:**
- **On CREATE:** Set `author = req.user.id`
- **On UPDATE:** Always preserve original value (reject any changes)

**Applied to:** `author` field

### 3. trackBlogPostCreator (beforeChange)

**Purpose:** Auto-populate and enforce immutability of `created_by` field

**Security Pattern:** SP-001 (Layer 3: Business Logic)

**Process:**
- **On CREATE:** Set `created_by = req.user.id`
- **On UPDATE:** Always preserve original value (reject any changes)

**Applied to:** `created_by` field

### 4. setPublicationTimestamp (beforeChange)

**Purpose:** Auto-set publication timestamp and enforce immutability

**Security Pattern:** SP-001 (Layer 3: Business Logic)

**Business Logic:**
- Set `published_at` ONLY when status changes to 'published' for first time
- Once set, `published_at` is IMMUTABLE (never changes on subsequent updates)

**Applied to:** `published_at` field

### 5. setArchivedTimestamp (beforeChange)

**Purpose:** Auto-set archive timestamp and enforce immutability

**Security Pattern:** SP-001 (Layer 3: Business Logic)

**Business Logic:**
- Set `archived_at` when status changes to 'archived'
- Once set, `archived_at` is IMMUTABLE
- Archived is a TERMINAL state

**Applied to:** `archived_at` field

### 6. calculateReadTime (beforeChange)

**Purpose:** Auto-calculate estimated read time from content

**Security Pattern:** SP-001 (Layer 3: Business Logic)

**Calculation:**
- Extract plain text from richText content nodes
- Count words (split by whitespace)
- Calculate: `words / 200` (200 words per minute average)
- Round up to nearest minute (minimum 1 minute)

**Example:**
```typescript
content: 400 words
read_time: 2 minutes (400 / 200 = 2)

content: 150 words
read_time: 1 minute (minimum)
```

**Applied to:** `estimated_read_time` field

### 7. validateBlogPostRelationships (beforeValidate)

**Purpose:** Validate related courses exist and enforce max 5 limit

**Validation:**
- Max 5 courses per post
- All course IDs must exist in database
- Throws error if validation fails

**Applied to:** Collection-level `beforeValidate` hook

---

## Security Patterns Applied

### SP-001: Immutable Fields (Defense in Depth)

All immutable fields implement **3-layer defense:**

#### Example: `author` field

**Layer 1 (UX):**
```typescript
admin: {
  readOnly: true, // Prevents editing in UI
  description: 'Post author (auto-populated, IMMUTABLE)',
}
```

**Layer 2 (Security):**
```typescript
access: {
  read: () => true,
  update: () => false, // Blocks API updates
}
```

**Layer 3 (Business Logic):**
```typescript
hooks: {
  beforeChange: [
    {
      hook: trackBlogPostAuthor, // Enforces immutability in code
    },
  ],
}
```

**Immutable Fields:**
1. `author` - Author tracking
2. `created_by` - Creator tracking
3. `published_at` - Publication timestamp
4. `archived_at` - Archive timestamp
5. `view_count` - System-managed metric
6. `estimated_read_time` - Auto-calculated metric

### SP-004: No Sensitive Logging

**Rules:**
- ❌ NO logging of `title`, `excerpt`, `content` (blog content)
- ❌ NO logging of `author.email`, `created_by.email` (PII)
- ❌ NO logging of `view_count`, `estimated_read_time` (business metrics)
- ✅ Only log `post.id`, `user.id`, `status` (non-sensitive)

**Example:**
```typescript
// ❌ PROHIBITED
console.log(`Post created: ${post.title}`); // Logs content

// ✅ ALLOWED
req.payload.logger.info('[BlogPost] Created', {
  postId: post.id,
  userId: user.id,
  status: post.status,
});
```

### URL Security Validation

All URL fields (`featured_image`, `og_image`) validate against:

1. **RFC-compliant URL format**
2. **Block triple slashes** (`///`) - malformed URLs
3. **Block newlines/control characters** (`\n`, `\r`, `\t`) - XSS prevention
4. **Block @ in hostname** - open redirect prevention

**Example:**
```typescript
// ✅ ALLOWED
"https://example.com/image.jpg"
"http://cdn.example.com/path/to/image.png"

// ❌ REJECTED
"https:///evil.com/malware" // Triple slashes
"https://example.com/\nmalicious" // Newline
"https://user@evil.com/image.jpg" // @ in hostname
```

### Ownership-Based Permissions

**Marketing role** can only update posts where `author = user.id`

**Implementation:**
```typescript
export const canUpdateBlogPost: Access = ({ req: { user } }) => {
  if (user.role === 'marketing') {
    return {
      author: { equals: user.id }, // Query constraint
    };
  }
  // ...
};
```

**Security Benefits:**
- Prevents privilege escalation
- Enforces data isolation
- No manual checks needed (Payload enforces at query level)

---

## API Usage Examples

### Create Blog Post (Marketing)

```typescript
const post = await payload.create({
  collection: 'blog_posts',
  data: {
    title: 'Learn JavaScript in 2025',
    excerpt: 'A comprehensive guide to learning JavaScript in 2025. This excerpt provides a preview of the blog post content.',
    content: [
      {
        type: 'paragraph',
        children: [{ text: 'JavaScript is the most popular programming language...' }],
      },
    ],
    status: 'draft',
    featured: true,
    tags: ['javascript', 'programming', 'education'],
    related_courses: ['course-id-1', 'course-id-2'],
    meta_title: 'Learn JavaScript in 2025 - Complete Beginner Guide - CEP',
    meta_description: 'Master JavaScript programming in 2025 with our comprehensive guide. Perfect for beginners and intermediate developers. Start your coding journey today.',
    language: 'en',
  },
  user: marketingUser,
});

console.log(post.slug); // "learn-javascript-in-2025"
console.log(post.author); // marketingUser.id (auto-populated)
console.log(post.estimated_read_time); // 5 minutes (auto-calculated)
```

### Publish Post

```typescript
const published = await payload.update({
  collection: 'blog_posts',
  id: post.id,
  data: {
    status: 'published',
  },
  user: marketingUser,
});

console.log(published.published_at); // "2025-10-23T10:30:00.000Z" (auto-set)
```

### Query Published Posts (Public)

```typescript
const publicPosts = await payload.find({
  collection: 'blog_posts',
  // No user = public access
  // Automatically filters to status=published
});

console.log(publicPosts.docs.every((p) => p.status === 'published')); // true
```

### Query by Tags

```typescript
const educationPosts = await payload.find({
  collection: 'blog_posts',
  where: {
    tags: { contains: 'education' },
  },
  user: adminUser,
});
```

### Query by Language

```typescript
const spanishPosts = await payload.find({
  collection: 'blog_posts',
  where: {
    language: { equals: 'es' },
  },
  user: adminUser,
});
```

### Query Featured Posts

```typescript
const featuredPosts = await payload.find({
  collection: 'blog_posts',
  where: {
    status: { equals: 'published' },
    featured: { equals: true },
  },
  limit: 5,
  sort: '-published_at',
});
```

### Query with Related Courses Populated

```typescript
const postWithCourses = await payload.findByID({
  collection: 'blog_posts',
  id: postId,
  depth: 1, // Populate relationships
  user: adminUser,
});

console.log(postWithCourses.related_courses[0].name); // "Advanced JavaScript Course"
```

### Archive Post

```typescript
const archived = await payload.update({
  collection: 'blog_posts',
  id: post.id,
  data: {
    status: 'archived',
  },
  user: gestorUser,
});

console.log(archived.archived_at); // "2025-10-23T15:00:00.000Z" (auto-set)

// Try to change from archived (will fail - terminal state)
await payload.update({
  collection: 'blog_posts',
  id: post.id,
  data: {
    status: 'draft',
  },
  user: adminUser,
}); // Error: "Cannot change status from archived. Archived is a terminal status."
```

### Marketing User - Update Own Post

```typescript
// ✅ ALLOWED (own post)
const updated = await payload.update({
  collection: 'blog_posts',
  id: ownPostId,
  data: {
    title: 'Updated Title',
  },
  user: marketingUser,
});

// ❌ DENIED (other user's post)
await payload.update({
  collection: 'blog_posts',
  id: otherPostId,
  data: {
    title: 'Hijacked Title',
  },
  user: marketingUser,
}); // Error: 403 Forbidden
```

---

## Validation Rules

### Title
- **Required:** Yes
- **Min Length:** 10 characters
- **Max Length:** 120 characters
- **Format:** Any characters allowed

### Slug
- **Required:** Yes (auto-generated)
- **Unique:** Must be unique across all posts
- **Format:** Lowercase, alphanumeric, hyphens only
- **Max Length:** 150 characters
- **Auto-generation:** Normalized from title with Spanish character conversion

### Excerpt
- **Required:** Yes
- **Min Length:** 50 characters
- **Max Length:** 300 characters

### Content
- **Required:** Yes
- **Format:** Payload richText (array of nodes)

### Featured Image / OG Image
- **Required:** No
- **Format:** Valid HTTP/HTTPS URL
- **Security Checks:** RFC-compliant, no triple slashes, no newlines, no @ in hostname
- **Max Length:** 500 characters

### Tags
- **Required:** No
- **Max Count:** 10 tags
- **Format:** Lowercase, alphanumeric, hyphens only
- **Max Length per Tag:** 30 characters

### Related Courses
- **Required:** No
- **Max Count:** 5 courses
- **Validation:** All course IDs must exist in database

### Meta Title
- **Required:** No
- **Min Length:** 50 characters (SEO best practice)
- **Max Length:** 70 characters (SEO best practice)

### Meta Description
- **Required:** No
- **Min Length:** 120 characters (SEO best practice)
- **Max Length:** 160 characters (SEO best practice)

### Status
- **Required:** Yes
- **Default:** `draft`
- **Values:** `draft`, `published`, `archived`
- **Workflow Validation:** Cannot transition from `archived` (terminal state)

### Language
- **Required:** Yes
- **Default:** `es`
- **Values:** `es` (Spanish), `en` (English), `ca` (Catalan)

---

## Status Workflow

### State Machine

```
draft ──────► published ──────► archived (TERMINAL)
  │                                  ▲
  └──────────────────────────────────┘
```

### Allowed Transitions

| From | To | Allowed | Notes |
|------|-------|---------|-------|
| draft | published | ✅ | Sets `published_at` (immutable) |
| draft | archived | ✅ | Sets `archived_at` (immutable) |
| published | archived | ✅ | Sets `archived_at` (immutable) |
| published | draft | ✅ | Allows reverting to draft |
| archived | draft | ❌ | **TERMINAL STATE** |
| archived | published | ❌ | **TERMINAL STATE** |

### Terminal State Enforcement

**Archived is a terminal state:**
- Once a post is archived, it **CANNOT** be changed to any other status
- Enforced in field validation
- Prevents data corruption and workflow abuse

**Example:**
```typescript
// ✅ ALLOWED: draft → published
await payload.update({
  collection: 'blog_posts',
  id: postId,
  data: { status: 'published' },
  user: adminUser,
});

// ✅ ALLOWED: published → archived
await payload.update({
  collection: 'blog_posts',
  id: postId,
  data: { status: 'archived' },
  user: adminUser,
});

// ❌ DENIED: archived → draft
await payload.update({
  collection: 'blog_posts',
  id: postId,
  data: { status: 'draft' },
  user: adminUser,
}); // Error: "Cannot change status from archived. Archived is a terminal status."
```

---

## Testing

**Test Suite:** `BlogPosts.test.ts`

**Total Tests:** 120+

### Test Coverage

1. **CRUD Operations (15 tests)**
   - Create with minimum/all fields
   - Read by ID
   - Update posts
   - Delete posts
   - Pagination
   - Filtering (status, author, tags, featured, language)
   - Sorting
   - Search

2. **Validation (25 tests)**
   - Required fields
   - Length constraints (title, excerpt, meta_title, meta_description)
   - URL format validation
   - URL security checks (triple slashes, newlines, @ in hostname)
   - Tag validation (format, count)
   - Related courses validation (max 5, exist)
   - Status enum validation
   - Language enum validation
   - Slug uniqueness

3. **Access Control (18 tests)**
   - Public read (published only)
   - Public create/update/delete denied
   - Lectura role (read-only)
   - Asesor role (read-only)
   - Marketing role (create, read all, update own, delete denied)
   - Gestor role (full CRUD)
   - Admin role (full CRUD)
   - Ownership enforcement

4. **Relationships (10 tests)**
   - Author auto-population
   - Created_by auto-population
   - Related courses linking
   - Relationship population (depth query)
   - Non-existent course rejection
   - Empty/null related courses
   - Update related courses
   - Cascade behavior on delete

5. **Hooks (15 tests)**
   - Slug auto-generation
   - Spanish character normalization
   - Duplicate slug handling (numeric suffix)
   - Publication timestamp auto-set
   - Publication timestamp immutability
   - Archive timestamp auto-set
   - Archive timestamp immutability
   - Read time calculation
   - Read time recalculation on update
   - View count initialization
   - Relationship validation

6. **Security (15 tests)**
   - Immutability of author, created_by, published_at, archived_at, view_count, estimated_read_time
   - URL security validation (all attack vectors)
   - Ownership enforcement
   - Terminal state enforcement
   - No PII logging (documentation test)

7. **Business Logic (22 tests)**
   - Status workflow transitions (all combinations)
   - Terminal state enforcement
   - Default values (language, status, featured)
   - Read time calculation accuracy
   - Tag handling (empty, multiple, max)
   - Rich content handling
   - Metadata preservation on update
   - Slug update on title change
   - Spanish character support
   - Multi-language support
   - Max related courses

### Running Tests

```bash
# Run all BlogPosts tests
npm test BlogPosts.test.ts

# Run specific test suite
npm test -- --testNamePattern="CRUD Operations"

# Run with coverage
npm test -- --coverage BlogPosts.test.ts
```

---

## File Structure

```
apps/cms/src/collections/BlogPosts/
├── BlogPosts.ts                      # Main collection (650 lines)
├── BlogPosts.test.ts                 # Test suite (2,500 lines, 120+ tests)
├── BlogPosts.validation.ts           # Zod schemas (350 lines)
├── README.md                         # This file (900 lines)
├── index.ts                          # Exports
├── access/
│   ├── canCreateBlogPost.ts         # Create access control
│   ├── canReadBlogPosts.ts          # Read access control
│   ├── canUpdateBlogPost.ts         # Update access control (ownership-based)
│   ├── canDeleteBlogPost.ts         # Delete access control
│   └── index.ts                     # Access control exports
└── hooks/
    ├── generateSlug.ts              # Auto-generate slug from title
    ├── trackBlogPostAuthor.ts       # Auto-populate author (immutable)
    ├── trackBlogPostCreator.ts      # Auto-populate created_by (immutable)
    ├── setPublicationTimestamp.ts   # Auto-set published_at (immutable)
    ├── setArchivedTimestamp.ts      # Auto-set archived_at (immutable)
    ├── calculateReadTime.ts         # Auto-calculate read time (immutable)
    ├── validateBlogPostRelationships.ts # Validate related courses
    └── index.ts                     # Hooks exports
```

**Total Lines:** ~4,400 lines

---

## Integration with Payload Config

```typescript
// apps/cms/src/payload.config.ts
import { BlogPosts } from './collections/BlogPosts';

export default buildConfig({
  collections: [
    // ... other collections
    BlogPosts, // Collection #11
    // ... remaining collections
  ],
});
```

---

## SEO Best Practices

### Meta Title
- **Optimal Length:** 50-70 characters
- **Why:** Google displays ~60 characters in search results
- **Include:** Primary keyword, brand name
- **Example:** `Learn JavaScript in 2025 - Complete Guide - CEP Formación`

### Meta Description
- **Optimal Length:** 120-160 characters
- **Why:** Google displays ~155 characters in search results
- **Include:** Primary keyword, call-to-action, value proposition
- **Example:** `Master JavaScript programming in 2025 with our comprehensive guide. Perfect for beginners and intermediate developers. Enroll now at CEP Formación.`

### OG Image
- **Format:** JPG, PNG
- **Recommended Size:** 1200x630 pixels
- **Purpose:** Social sharing preview (Facebook, Twitter, LinkedIn)
- **Best Practices:** Include branding, clear text, high contrast

### URL Structure
- **Format:** `/blog/{slug}`
- **Example:** `/blog/learn-javascript-in-2025`
- **SEO Benefits:** Clean URLs, keyword-rich, readable

---

## Performance Considerations

### Indexes
- `slug` - Unique lookups
- `status` - Filtering published posts
- `author` - Ownership queries
- `language` - Multi-language filtering
- `featured` - Homepage featured posts

### Query Optimization
- Use `depth: 0` when relationship data not needed (faster)
- Use `limit` and pagination for large result sets
- Filter by `status=published` for public queries
- Use `select` to fetch only needed fields

**Example - Optimized Public Query:**
```typescript
const posts = await payload.find({
  collection: 'blog_posts',
  where: {
    status: { equals: 'published' },
    language: { equals: 'es' },
  },
  limit: 10,
  sort: '-published_at',
  depth: 0, // Don't populate relationships
});
```

---

## Migration Notes

### From Existing WordPress Blog

1. **Export WordPress posts** to JSON
2. **Map fields:**
   - `post_title` → `title`
   - `post_name` → `slug`
   - `post_excerpt` → `excerpt`
   - `post_content` → `content` (convert to richText)
   - `post_status` → `status` (map: publish→published, draft→draft)
   - `post_date` → `published_at`
   - `post_author` → `author`
3. **Import via Payload API:**
   ```typescript
   for (const wpPost of wordpressPosts) {
     await payload.create({
       collection: 'blog_posts',
       data: mapWordPressPost(wpPost),
       user: migrationUser,
     });
   }
   ```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-23 | 1.0.0 | Initial implementation with TDD, SP-001, SP-004 |

---

## Maintainers

- **Primary:** @payload-cms-architect
- **Security Review:** @security-gdpr-compliance
- **Testing:** TDD methodology

---

## References

- [Security Patterns Library](../../SECURITY_PATTERNS.md)
- [Payload CMS v3 Documentation](https://payloadcms.com/docs)
- [Zod Validation](https://zod.dev)
- [SEO Best Practices](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

# AdsTemplates Collection - User Guide

**Collection:** `ads_templates`
**Purpose:** Manage reusable ad templates for marketing campaigns
**Phase:** Phase 1 (Collection #10 of 13)
**Status:** ✅ Production Ready
**Security:** 0 vulnerabilities (SP-001, SP-004 applied)

---

## Table of Contents

1. [Overview](#overview)
2. [Access Control (6-Tier RBAC)](#access-control-6-tier-rbac)
3. [Fields Reference](#fields-reference)
4. [Template Types](#template-types)
5. [Status Workflow](#status-workflow)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)
8. [Security Considerations](#security-considerations)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The **AdsTemplates** collection stores reusable marketing templates for various advertising channels:

- **Email templates** (newsletters, promotional emails)
- **Social media posts** (Facebook, Instagram, LinkedIn, Twitter)
- **Display ads** (banner ads, sidebar ads)
- **Landing pages** (lead capture, product pages)
- **Video scripts** (YouTube, TikTok, video ads)
- **Other** (custom template types)

### Key Features

✅ **Multi-channel support** - Email, social, display, landing pages, video
✅ **Version tracking** - Immutable version numbers
✅ **Ownership-based permissions** - Marketing users can only edit their own templates
✅ **Multi-language** - Spanish (es), English (en), Catalan (ca)
✅ **Rich content** - Rich text editor for body copy
✅ **Asset management** - Image and video URL storage
✅ **Tag-based organization** - Flexible tagging system
✅ **Soft delete** - Templates can be archived without permanent deletion
✅ **Audit trail** - Track creator and timestamps

---

## Access Control (6-Tier RBAC)

### Public (Unauthenticated)
- ❌ **CREATE:** No
- ❌ **READ:** No (marketing assets are confidential)
- ❌ **UPDATE:** No
- ❌ **DELETE:** No

**Reason:** Marketing templates contain confidential business intelligence and creative strategies.

### Lectura Role (Read-Only)
- ❌ **CREATE:** No
- ✅ **READ:** Yes (view all templates)
- ❌ **UPDATE:** No
- ❌ **DELETE:** No

**Use Case:** View templates for reporting or reference purposes.

### Asesor Role (Advisor)
- ❌ **CREATE:** No
- ✅ **READ:** Yes (view all templates)
- ❌ **UPDATE:** No
- ❌ **DELETE:** No

**Use Case:** View templates to understand marketing messaging for client interactions.

### Marketing Role
- ✅ **CREATE:** Yes (primary users who create templates)
- ✅ **READ:** Yes (view all templates)
- ✅ **UPDATE:** Yes (only own templates - ownership-based)
- ❌ **DELETE:** No (use `active=false` for soft delete instead)

**Use Case:** Create and manage marketing templates. Can only edit templates created by them.

### Gestor Role (Manager)
- ✅ **CREATE:** Yes
- ✅ **READ:** Yes (view all templates)
- ✅ **UPDATE:** Yes (all templates)
- ✅ **DELETE:** Yes (hard delete)

**Use Case:** Full management of all templates, including oversight of Marketing team's work.

### Admin Role
- ✅ **CREATE:** Yes
- ✅ **READ:** Yes (view all templates)
- ✅ **UPDATE:** Yes (all templates)
- ✅ **DELETE:** Yes (hard delete)

**Use Case:** System administration and full template management.

---

## Fields Reference

### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | Text | Template name (unique) | Min 3, max 100 chars, alphanumeric + spaces/hyphens/underscores |
| `template_type` | Select | Template type | Must be one of: email, social_post, display_ad, landing_page, video_script, other |
| `status` | Select | Template status | Must be one of: draft, active, archived |
| `headline` | Text | Ad headline/subject line | Required, max 100 chars |
| `body_copy` | RichText | Main ad copy | Required, rich text editor |
| `tone` | Select | Ad tone | Must be one of: professional, casual, urgent, friendly, educational, promotional |
| `language` | Select | Content language | Must be one of: es (Spanish), en (English), ca (Catalan) |

### Optional Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `description` | Textarea | Template description | Optional, max 1000 chars |
| `campaign` | Relationship | Associated campaign | Optional, references Campaigns collection |
| `call_to_action` | Text | CTA button text | Optional, max 50 chars |
| `cta_url` | Text | CTA destination URL | Optional, must be valid http/https URL |
| `primary_image_url` | Text | Main image URL | Optional, must be valid http/https URL |
| `secondary_image_url` | Text | Secondary image URL | Optional, must be valid http/https URL |
| `video_url` | Text | Video asset URL | Optional, must be valid http/https URL |
| `thumbnail_url` | Text | Thumbnail URL | Optional, must be valid http/https URL |
| `target_audience` | Textarea | Target demographic | Optional, max 1000 chars |
| `tags` | Array[Text] | Template tags | Optional, max 10 tags, lowercase alphanumeric + hyphens |

### System-Managed Fields (Immutable)

| Field | Type | Description | Access |
|-------|------|-------------|--------|
| `version` | Number | Version number (starts at 1) | Read-only, auto-set on create |
| `usage_count` | Number | Times template was used | Read-only, system-tracked |
| `last_used_at` | Date | Last usage timestamp | Read-only, system-tracked |
| `archived_at` | Date | When template was archived | Read-only, auto-set when status → archived |
| `created_by` | Relationship | User who created template | Read-only, auto-populated |
| `createdAt` | Date | Creation timestamp | Read-only, auto-generated by Payload |
| `updatedAt` | Date | Last update timestamp | Read-only, auto-generated by Payload |

### Soft Delete Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `active` | Checkbox | Active status (false = soft deleted) | true |

---

## Template Types

### Email (`email`)
**Use for:** Newsletters, promotional emails, transactional emails

**Best practices:**
- Keep headline under 50 chars for mobile subject lines
- Use personalization tokens in body_copy
- Include clear CTA with compelling copy
- Test across email clients

### Social Post (`social_post`)
**Use for:** Facebook, Instagram, LinkedIn, Twitter posts

**Best practices:**
- Headline should be attention-grabbing (under 100 chars)
- Body copy should be concise (varies by platform)
- Include hashtags in tags field
- Primary image should be optimized for platform specs

### Display Ad (`display_ad`)
**Use for:** Banner ads, sidebar ads, retargeting ads

**Best practices:**
- Headline must be ultra-concise (under 50 chars)
- Body copy should be minimal (1-2 lines)
- CTA should be action-oriented ("Shop Now", "Learn More")
- Primary image must meet platform size requirements

### Landing Page (`landing_page`)
**Use for:** Lead capture pages, product pages, event registrations

**Best practices:**
- Headline should communicate value proposition
- Body copy should address pain points
- Include social proof or testimonials
- CTA should be clear and prominent

### Video Script (`video_script`)
**Use for:** YouTube ads, TikTok videos, video marketing

**Best practices:**
- Headline is the hook (first 3 seconds)
- Body copy is the script
- Include video_url for final video
- Thumbnail_url for preview image

### Other (`other`)
**Use for:** Custom template types not covered above

---

## Status Workflow

Templates follow a linear status workflow:

```
draft → active → archived (terminal)
```

### Draft
- **Purpose:** Template is being created or edited
- **Transitions:** Can move to `active` or `archived`
- **Visibility:** Visible to all authenticated users
- **Editing:** Marketing users can edit own templates

### Active
- **Purpose:** Template is ready for use in campaigns
- **Transitions:** Can move to `archived`
- **Visibility:** Visible to all authenticated users
- **Editing:** Marketing users can edit own templates

### Archived (Terminal Status)
- **Purpose:** Template is retired and no longer in use
- **Transitions:** ❌ NONE (terminal state - cannot transition from archived)
- **Visibility:** Visible but marked as archived
- **Editing:** Cannot change status from archived
- **Timestamp:** `archived_at` is auto-set and immutable

**⚠️ Important:** Once a template is archived, the status cannot be changed. This is intentional to preserve historical data integrity.

**Alternative:** If you need to "reactivate" an archived template, create a new template with the same content (copy/paste) and increment the version number.

---

## Usage Examples

### Example 1: Create Email Template

```json
POST /api/ads_templates

{
  "name": "Spring Enrollment Email 2025",
  "description": "Promotional email for spring semester enrollment",
  "template_type": "email",
  "status": "draft",
  "headline": "Enroll Now - Spring 2025 Courses Open",
  "body_copy": "<h2>Transform Your Career This Spring</h2><p>Join over 1,000 students...</p>",
  "call_to_action": "Enroll Today",
  "cta_url": "https://www.cepcomunicacion.com/enroll",
  "primary_image_url": "https://cdn.cepcomunicacion.com/images/spring-banner.jpg",
  "target_audience": "Young professionals aged 25-35 interested in career advancement",
  "tone": "professional",
  "language": "es",
  "tags": ["spring", "enrollment", "email", "professional"]
}
```

### Example 2: Create Social Media Post

```json
POST /api/ads_templates

{
  "name": "Instagram Post - Course Promotion",
  "template_type": "social_post",
  "status": "active",
  "headline": "🚀 Transform Your Career in 6 Months!",
  "body_copy": "Join our intensive certification program. Limited spots available! 👇",
  "call_to_action": "Learn More",
  "cta_url": "https://www.cepcomunicacion.com/courses",
  "primary_image_url": "https://cdn.cepcomunicacion.com/social/course-promo.jpg",
  "tone": "casual",
  "language": "es",
  "tags": ["instagram", "course-promotion", "social"]
}
```

### Example 3: Query Templates by Type

```
GET /api/ads_templates?where[template_type][equals]=email&where[status][equals]=active
```

**Returns:** All active email templates

### Example 4: Query Templates by Language

```
GET /api/ads_templates?where[language][equals]=es&where[active][equals]=true
```

**Returns:** All active Spanish templates

### Example 5: Soft Delete Template

```json
PATCH /api/ads_templates/{id}

{
  "active": false
}
```

**Result:** Template is soft-deleted (not shown in default queries)

### Example 6: Archive Template

```json
PATCH /api/ads_templates/{id}

{
  "status": "archived"
}
```

**Result:**
- Template status set to `archived`
- `archived_at` timestamp auto-set
- Status becomes immutable (terminal state)

---

## Best Practices

### 1. Naming Conventions

✅ **Good:**
- "Spring Email Campaign 2025"
- "Facebook Ad - Course Promo v2"
- "Landing Page - Lead Magnet"

❌ **Avoid:**
- "Template 1" (too generic)
- "URGENT EMAIL!!!" (excessive)
- "test" (not descriptive)

### 2. Version Management

- **Initial version:** Always starts at 1 (auto-set)
- **Major changes:** Create new template with incremented version in name
- **Minor edits:** Update existing template (version stays 1)

**Example:**
```
"Spring Email v1" (version: 1)
"Spring Email v2" (version: 1 - new template)
"Spring Email v3" (version: 1 - new template)
```

### 3. Tag Usage

✅ **Good tags:**
- "spring-2025"
- "email-campaign"
- "course-promotion"
- "spanish"

❌ **Invalid tags:**
- "Spring-2025" (uppercase not allowed)
- "email campaign" (spaces not allowed)
- "course_promotion" (underscores not allowed)

**Validation rules:**
- Lowercase only
- Alphanumeric + hyphens
- Max 10 tags per template

### 4. URL Best Practices

- Always use full URLs (include `https://`)
- Use CDN URLs for images/videos
- Include UTM parameters in `cta_url` for tracking
- Test all URLs before activating template

**Example CTA URL with tracking:**
```
https://www.cepcomunicacion.com/enroll?utm_source=email&utm_medium=template&utm_campaign=spring2025
```

### 5. Content Guidelines

**Headline:**
- Email subject lines: 30-50 chars ideal
- Social posts: 60-80 chars max
- Display ads: 25-35 chars max

**Body Copy:**
- Email: 100-300 words
- Social posts: 50-150 words
- Display ads: 10-30 words
- Landing pages: 200-500 words

**Call to Action:**
- Be specific and action-oriented
- Use verbs: "Enroll", "Download", "Register", "Learn"
- Keep under 3 words when possible

### 6. Multi-Language Management

- Create separate templates for each language
- Use language code in name: "Email Template (ES)", "Email Template (EN)"
- Translate all fields: headline, body_copy, CTA
- Set correct `language` field

### 7. Soft Delete vs Hard Delete

**Use soft delete (`active=false`) when:**
- Template might be needed for reference
- Template has historical campaign associations
- You want to keep audit trail

**Use hard delete (Gestor/Admin only) when:**
- Template contains sensitive/confidential data
- Template was created in error
- Permanent removal is required

### 8. Campaign Association

**Link to campaign when:**
- Template is created specifically for one campaign
- You want to track template usage per campaign

**Leave campaign empty when:**
- Template is general-purpose (reusable)
- Template might be used across multiple campaigns

---

## Security Considerations

### Confidential Marketing Assets

⚠️ **All template content is considered confidential business intelligence:**

- Headlines and copy reveal marketing strategies
- Target audience data contains competitive insights
- Asset URLs may contain tracking parameters
- Tag patterns reveal campaign structure

**Protection measures:**
- Public access denied (must be authenticated)
- No logging of template content (SP-004)
- Ownership-based edit permissions
- Audit trail for all changes

### Immutable Fields (SP-001)

The following fields **cannot be modified** after creation:

1. **created_by** - User who created template
2. **version** - Version number (always 1 per template)
3. **usage_count** - System-tracked usage counter
4. **last_used_at** - System-tracked timestamp
5. **archived_at** - Set when status → archived, then immutable

**3-Layer Defense:**
- Layer 1 (UX): `admin.readOnly = true` (UI protection)
- Layer 2 (Security): `access.update = false` (API protection)
- Layer 3 (Business Logic): Hooks enforce immutability

**Attempting to modify these fields will fail silently** (changes ignored).

### Ownership-Based Permissions

**Marketing users can only edit templates they created:**

```javascript
// Marketing user trying to edit another user's template
PATCH /api/ads_templates/123
// ❌ DENIED (if created_by !== current user)

// Marketing user editing their own template
PATCH /api/ads_templates/456
// ✅ ALLOWED (if created_by === current user)
```

**Gestor and Admin can edit any template.**

### URL Validation (XSS Prevention)

All URL fields are validated to prevent XSS attacks:

✅ **Allowed:**
- `https://www.example.com`
- `http://example.com`

❌ **Blocked:**
- `javascript:alert('XSS')`
- `data:text/html,<script>alert('XSS')</script>`
- `file:///etc/passwd`

**Only `http://` and `https://` protocols are allowed.**

### Tag Injection Prevention

Tag format validation prevents injection attacks:

✅ **Allowed:**
- `spring-2025`
- `email`
- `course-123`

❌ **Blocked:**
- `<script>alert('XSS')</script>`
- `'; DROP TABLE ads_templates; --`
- `../../../etc/passwd`

**Tags must be lowercase, alphanumeric, and may contain hyphens only.**

---

## API Reference

### Base URL
```
/api/ads_templates
```

### Endpoints

#### Create Template
```http
POST /api/ads_templates
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Template Name",
  "template_type": "email",
  "status": "draft",
  "headline": "Headline",
  "body_copy": "<p>Body</p>",
  "tone": "professional",
  "language": "es"
}
```

**Response:** `201 Created`

#### Read All Templates
```http
GET /api/ads_templates
Authorization: Bearer {token}
```

**Response:** `200 OK`

#### Read Single Template
```http
GET /api/ads_templates/{id}
Authorization: Bearer {token}
```

**Response:** `200 OK`

#### Update Template
```http
PATCH /api/ads_templates/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "headline": "Updated Headline",
  "status": "active"
}
```

**Response:** `200 OK`

**Note:** Marketing users can only update own templates.

#### Delete Template (Gestor/Admin only)
```http
DELETE /api/ads_templates/{id}
Authorization: Bearer {token}
```

**Response:** `200 OK`

### Query Parameters

#### Filter by Type
```
?where[template_type][equals]=email
```

#### Filter by Status
```
?where[status][equals]=active
```

#### Filter by Language
```
?where[language][equals]=es
```

#### Filter by Campaign
```
?where[campaign][equals]=123
```

#### Filter by Creator
```
?where[created_by][equals]=456
```

#### Filter by Active Status
```
?where[active][equals]=true
```

#### Pagination
```
?limit=10&page=1
```

#### Sorting
```
?sort=-createdAt  // Newest first
?sort=name        // Alphabetical
```

#### Deep Population
```
?depth=1  // Populate campaign and created_by
?depth=2  // Deep populate nested relationships
```

### GraphQL Support

AdsTemplates collection is available via GraphQL:

```graphql
query GetEmailTemplates {
  AdsTemplates(
    where: {
      template_type: { equals: email }
      status: { equals: active }
    }
  ) {
    docs {
      id
      name
      headline
      body_copy
      call_to_action
      cta_url
      language
      tags
      created_by {
        email
      }
      createdAt
    }
  }
}
```

---

## Troubleshooting

### Issue: "Cannot change status from archived"

**Cause:** Archived is a terminal status (by design).

**Solution:** Create a new template with the same content if you need to "reactivate" it.

```bash
# Copy archived template content
GET /api/ads_templates/123

# Create new template with same content
POST /api/ads_templates
{
  "name": "Template Name v2",
  ...
}
```

### Issue: "Template name must be unique"

**Cause:** Another template already exists with the same name.

**Solution:** Use a different name or add version suffix.

```json
{
  "name": "Spring Email v2"
}
```

### Issue: "Headline must be 100 characters or less"

**Cause:** Headline exceeds platform requirements.

**Solution:** Shorten headline or use body_copy for longer text.

```json
{
  "headline": "Short, punchy headline here",
  "body_copy": "<p>Longer explanation goes in body copy...</p>"
}
```

### Issue: "Tags must be lowercase"

**Cause:** Tags contain uppercase letters.

**Solution:** Convert tags to lowercase.

```json
// ❌ WRONG
{
  "tags": ["Email", "Spring-2025"]
}

// ✅ CORRECT
{
  "tags": ["email", "spring-2025"]
}
```

### Issue: "CTA URL must be a valid URL"

**Cause:** URL is not properly formatted.

**Solution:** Include full URL with protocol.

```json
// ❌ WRONG
{
  "cta_url": "www.example.com"
}

// ✅ CORRECT
{
  "cta_url": "https://www.example.com"
}
```

### Issue: "Maximum 10 tags per template"

**Cause:** Too many tags provided.

**Solution:** Reduce to 10 most relevant tags.

```json
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
}
```

### Issue: "Access denied" when updating template

**Cause:** Marketing user trying to edit another user's template.

**Solution:** Only edit templates you created, or request Gestor/Admin assistance.

```bash
# Check template creator
GET /api/ads_templates/123

# If created_by !== your user ID, you cannot edit
# Contact Gestor or Admin for help
```

### Issue: Cannot modify `created_by`, `version`, or other system fields

**Cause:** These fields are immutable (by design - SP-001 security pattern).

**Solution:** These fields are managed by the system and cannot be manually changed.

**Immutable fields:**
- `created_by`
- `version`
- `usage_count`
- `last_used_at`
- `archived_at`

---

## Related Collections

- **Campaigns** - Link templates to specific marketing campaigns
- **Users** - Template creators tracked via `created_by`

---

## Support

For technical issues or questions:

1. Check this README first
2. Consult SECURITY_PATTERNS.md for security questions
3. Review test suite (AdsTemplates.test.ts) for usage examples
4. Contact system administrator

---

**Document Version:** 1.0
**Last Updated:** 2025-10-22
**Collection Version:** ads_templates v1.0
**Security Status:** ✅ 0 vulnerabilities (SP-001, SP-004 applied)

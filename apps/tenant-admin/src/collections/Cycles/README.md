# Cycles Collection

## Overview

The **Cycles Collection** represents educational cycles (FP Básica, Grado Medio, Grado Superior, Certificado de Profesionalidad) that categorize courses offered by CEP Comunicación.

## Database Schema

**PostgreSQL Table:** `cycles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| name | TEXT | NOT NULL | Display name of the cycle |
| description | TEXT | NULL | Detailed description |
| level | TEXT | NOT NULL, CHECK enum | Educational level (fp_basica, grado_medio, grado_superior, certificado_profesionalidad) |
| order_display | INTEGER | DEFAULT 0 | Display order (lower = first) |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Record last update timestamp |

**Indexes:**
- `idx_cycles_slug` on `slug`
- `idx_cycles_order_display` on `order_display`

## Access Control

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| Public (Anonymous) | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Lectura | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Asesor | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Marketing | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Gestor | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Implementation:** `hasMinimumRole(user.role, 'gestor')`

## API Endpoints

### REST API

#### List Cycles
```http
GET /api/cycles
```

**Query Parameters:**
- `limit`: Number of results (default: 10)
- `page`: Page number (default: 1)
- `sort`: Sort field (default: order_display)
- `where[level][equals]`: Filter by level

**Example:**
```bash
curl http://localhost:3001/api/cycles?limit=10&sort=order_display
```

#### Get Single Cycle
```http
GET /api/cycles/:id
```

#### Create Cycle (Admin/Gestor only)
```http
POST /api/cycles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Grado Superior",
  "description": "Formación Profesional de Grado Superior",
  "level": "grado_superior",
  "order_display": 3
}
```

**Note:** `slug` is auto-generated from `name` if not provided.

#### Update Cycle (Admin/Gestor only)
```http
PATCH /api/cycles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description"
}
```

#### Delete Cycle (Admin/Gestor only)
```http
DELETE /api/cycles/:id
Authorization: Bearer <token>
```

## Validation

### Field Validation

**slug:**
- Required (auto-generated if not provided)
- Max length: 100 characters
- Pattern: `^[a-z0-9-]+$` (lowercase, numbers, hyphens only)

**name:**
- Required
- Min length: 3 characters
- Max length: 100 characters

**description:**
- Optional
- Max length: 500 characters

**level:**
- Required
- Enum: `fp_basica`, `grado_medio`, `grado_superior`, `certificado_profesionalidad`

**order_display:**
- Optional (default: 0)
- Integer
- Range: 0-100

### Zod Schema

```typescript
import { validateCycle } from './collections/Cycles';

const result = validateCycle({
  slug: 'grado-superior',
  name: 'Grado Superior',
  level: 'grado_superior',
  order_display: 3,
});

if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.error('Invalid:', result.error);
}
```

## Hooks

### beforeValidate
**Purpose:** Auto-generate slug from name if not provided

**Logic:**
```typescript
if (data.name && !data.slug) {
  data.slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

**Example:**
- Input: `name: "Grado Superior"`
- Output: `slug: "grado-superior"`

## Usage Examples

### TypeScript (Payload SDK)

```typescript
import { getPayload } from 'payload';

const payload = await getPayload({ config });

// Create cycle
const cycle = await payload.create({
  collection: 'cycles',
  data: {
    name: 'Grado Medio',
    description: 'Formación Profesional de Grado Medio',
    level: 'grado_medio',
    order_display: 2,
  },
});

// Find cycles
const cycles = await payload.find({
  collection: 'cycles',
  where: {
    level: {
      equals: 'grado_superior',
    },
  },
  sort: 'order_display',
});
```

## Testing

Tests are located at: `/apps/cms/src/collections/Cycles/Cycles.test.ts`

**Run tests:**
```bash
pnpm test:cms
```

**Test coverage:**
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Validation (required fields, enums, uniqueness)
- ✅ Access control (public read, admin/gestor write)
- ✅ Auto-slug generation
- ✅ Sorting and filtering

## TDD Implementation Status

- ✅ Tests written
- ✅ Collection config implemented
- ✅ Access control implemented
- ✅ Validation implemented (Payload + Zod)
- ✅ Hooks implemented (auto-slug)
- ✅ Index file created
- ✅ TypeScript types defined

## Files

```
/apps/cms/src/collections/Cycles/
├── Cycles.ts                    # Collection configuration
├── Cycles.test.ts              # Test suite
├── Cycles.validation.ts        # Zod validation schemas
├── index.ts                    # Module exports
├── README.md                   # This file
└── access/
    └── canManageCycles.ts      # Access control function
```

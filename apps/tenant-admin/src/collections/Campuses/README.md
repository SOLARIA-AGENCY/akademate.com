# Campuses Collection

Physical locations (campuses) where CEP Comunicación operates and offers courses.

## Overview

The Campuses collection manages information about the physical locations where CEP Comunicación delivers educational programs. Each campus has contact information, location details, and a link to Google Maps for easy navigation.

## Database Schema

**Table:** `campuses`

```sql
CREATE TABLE campuses (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  maps_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campuses_slug ON campuses(slug);
CREATE INDEX idx_campuses_city ON campuses(city);
```

## Field Specifications

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `slug` | text | Yes | Lowercase alphanumeric + hyphens, max 100 chars | URL-friendly identifier |
| `name` | text | Yes | 3-100 characters | Display name (e.g., "Madrid Centro") |
| `city` | text | Yes | 2-50 characters | City location |
| `address` | textarea | No | Max 200 characters | Full street address |
| `postal_code` | text | No | Exactly 5 digits | Spanish postal code (e.g., "28001") |
| `phone` | text | No | Format: +34 XXX XXX XXX | Spanish phone number |
| `email` | email | No | Valid email, max 100 chars | Contact email |
| `maps_url` | text | No | Valid URL | Google Maps URL |

## Validation Rules

### Postal Code
- **Format:** Exactly 5 digits
- **Examples:**
  - ✅ `28001` (Madrid)
  - ✅ `08001` (Barcelona)
  - ❌ `123` (too short)
  - ❌ `280001` (too long)

### Phone Number
- **Format:** `+34 XXX XXX XXX`
- **Examples:**
  - ✅ `+34 912 345 678`
  - ✅ `+34 963 123 456`
  - ❌ `912345678` (missing country code and spaces)
  - ❌ `+34 9123456` (incorrect grouping)

### Email
- **Format:** Standard email validation
- **Examples:**
  - ✅ `madrid@cepcomunicacion.com`
  - ✅ `info.madrid@cepcomunicacion.com`
  - ❌ `not-an-email`

### Maps URL
- **Format:** Valid URL
- **Examples:**
  - ✅ `https://maps.google.com/?q=Madrid+Centro`
  - ✅ `https://goo.gl/maps/abc123`
  - ❌ `not-a-url`

## Access Control

| Operation | Allowed Roles | Public Access |
|-----------|---------------|---------------|
| Read | All | ✅ Yes (public) |
| Create | Admin, Gestor | ❌ No |
| Update | Admin, Gestor | ❌ No |
| Delete | Admin, Gestor | ❌ No |

## API Endpoints

### REST API

#### List Campuses
```http
GET /api/campuses
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `where` - Filter conditions (JSON)
- `sort` - Sort field (default: "name")

**Example Request:**
```bash
curl https://api.cepcomunicacion.com/api/campuses
```

**Example Response:**
```json
{
  "docs": [
    {
      "id": 1,
      "slug": "madrid-centro",
      "name": "Madrid Centro",
      "city": "Madrid",
      "address": "Calle Gran Vía 123",
      "postal_code": "28013",
      "phone": "+34 912 345 678",
      "email": "madrid.centro@cepcomunicacion.com",
      "maps_url": "https://maps.google.com/?q=Madrid+Centro",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "totalDocs": 1,
  "limit": 10,
  "page": 1,
  "totalPages": 1
}
```

#### Filter by City
```bash
curl 'https://api.cepcomunicacion.com/api/campuses?where[city][equals]=Madrid'
```

#### Get Single Campus
```http
GET /api/campuses/:id
```

**Example Request:**
```bash
curl https://api.cepcomunicacion.com/api/campuses/1
```

**Example Response:**
```json
{
  "id": 1,
  "slug": "madrid-centro",
  "name": "Madrid Centro",
  "city": "Madrid",
  "address": "Calle Gran Vía 123",
  "postal_code": "28013",
  "phone": "+34 912 345 678",
  "email": "madrid.centro@cepcomunicacion.com",
  "maps_url": "https://maps.google.com/?q=Madrid+Centro",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

#### Create Campus
```http
POST /api/campuses
Authorization: Bearer <token>
Content-Type: application/json
```

**Example Request:**
```bash
curl -X POST https://api.cepcomunicacion.com/api/campuses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Barcelona Plaza",
    "city": "Barcelona",
    "address": "Plaza Catalunya 1",
    "postal_code": "08002",
    "phone": "+34 934 567 890",
    "email": "barcelona@cepcomunicacion.com",
    "maps_url": "https://maps.google.com/?q=Barcelona+Plaza+Catalunya"
  }'
```

**Note:** Slug is auto-generated from name if not provided.

#### Update Campus
```http
PATCH /api/campuses/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Example Request:**
```bash
curl -X PATCH https://api.cepcomunicacion.com/api/campuses/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+34 912 999 888",
    "email": "madrid.nuevo@cepcomunicacion.com"
  }'
```

#### Delete Campus
```http
DELETE /api/campuses/:id
Authorization: Bearer <token>
```

**Example Request:**
```bash
curl -X DELETE https://api.cepcomunicacion.com/api/campuses/1 \
  -H "Authorization: Bearer <token>"
```

### GraphQL API

#### Query Campuses
```graphql
query {
  Campuses(limit: 10, page: 1, sort: "name") {
    docs {
      id
      slug
      name
      city
      address
      postal_code
      phone
      email
      maps_url
      createdAt
      updatedAt
    }
    totalDocs
    limit
    page
    totalPages
  }
}
```

#### Query Single Campus
```graphql
query {
  Campus(id: 1) {
    id
    slug
    name
    city
    address
    postal_code
    phone
    email
    maps_url
  }
}
```

#### Create Campus
```graphql
mutation {
  createCampus(data: {
    name: "Valencia Centro"
    city: "Valencia"
    address: "Calle de la Paz 15"
    postal_code: "46003"
    phone: "+34 963 456 789"
    email: "valencia@cepcomunicacion.com"
  }) {
    id
    slug
    name
    city
  }
}
```

## TypeScript Usage

### Import Types
```typescript
import type { CampusData, CampusCreateData, CampusUpdateData } from './collections/Campuses';
```

### Validation
```typescript
import { validateCampusCreate, formatSpanishPhone } from './collections/Campuses';

const data = {
  name: 'Madrid Centro',
  city: 'Madrid',
  phone: '912345678', // Will be formatted
};

// Format phone number
const formattedPhone = formatSpanishPhone(data.phone);
// Result: '+34 912 345 678'

// Validate data
const result = validateCampusCreate({ ...data, phone: formattedPhone });

if (result.success) {
  console.log('Valid campus data:', result.data);
} else {
  console.error('Validation errors:', result.error);
}
```

### Utility Functions
```typescript
import {
  isValidSpanishPostalCode,
  isValidSpanishPhone,
  formatSpanishPhone
} from './collections/Campuses';

// Validate postal code
isValidSpanishPostalCode('28001'); // true
isValidSpanishPostalCode('123'); // false

// Validate phone
isValidSpanishPhone('+34 912 345 678'); // true
isValidSpanishPhone('912345678'); // false

// Format phone
formatSpanishPhone('34912345678'); // '+34 912 345 678'
formatSpanishPhone('912345678'); // '+34 912 345 678'
```

## Common Use Cases

### Frontend: Display Campus List
```typescript
const response = await fetch('/api/campuses?sort=name');
const { docs: campuses } = await response.json();

campuses.forEach(campus => {
  console.log(`${campus.name} - ${campus.city}`);
  console.log(`Phone: ${campus.phone}`);
  console.log(`Email: ${campus.email}`);
});
```

### Frontend: Filter by City
```typescript
const city = 'Madrid';
const response = await fetch(`/api/campuses?where[city][equals]=${city}`);
const { docs: madridCampuses } = await response.json();
```

### Admin: Create New Campus
```typescript
const newCampus = {
  name: 'Sevilla Triana',
  city: 'Sevilla',
  address: 'Calle Betis 45',
  postal_code: '41010',
  phone: '+34 954 123 456',
  email: 'sevilla@cepcomunicacion.com',
  maps_url: 'https://maps.google.com/?q=Sevilla+Triana',
};

const response = await fetch('/api/campuses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newCampus),
});

const { doc } = await response.json();
console.log('Created campus:', doc);
```

## Error Handling

### Validation Errors
```json
{
  "errors": [
    {
      "message": "Phone must be in format: +34 XXX XXX XXX",
      "field": "phone"
    },
    {
      "message": "Postal code must be exactly 5 digits",
      "field": "postal_code"
    }
  ]
}
```

### Duplicate Slug
```json
{
  "errors": [
    {
      "message": "Value must be unique",
      "field": "slug"
    }
  ]
}
```

### Unauthorized
```json
{
  "errors": [
    {
      "message": "You are not authorized to perform this action"
    }
  ]
}
```

## Best Practices

1. **Always validate phone numbers** before submission using `formatSpanishPhone()`
2. **Use slug for URLs** instead of IDs for better SEO
3. **Cache campus data** on frontend as it changes infrequently
4. **Provide Google Maps links** for user convenience
5. **Keep contact information up-to-date** to ensure users can reach the right campus

## Related Collections

- **Courses** - Courses are offered at specific campuses
- **CourseRuns** - Individual course runs are tied to a campus location
- **Leads** - Lead inquiries may reference a preferred campus

## Testing

See `Campuses.test.ts` for comprehensive API tests covering:
- CRUD operations
- Validation rules
- Access control
- Data integrity
- Edge cases

Run tests:
```bash
npm test Campuses.test.ts
```

## Changelog

- **v1.0.0** - Initial implementation with TDD
  - Full CRUD operations
  - Spanish phone/postal code validation
  - Auto-slug generation
  - Public read access

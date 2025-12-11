# Users Collection - Authentication & Authorization

The Users collection is the authentication and authorization system for CEPComunicacion CMS. It implements a 5-tier role-based access control (RBAC) system with comprehensive security features.

## Table of Contents

- [Overview](#overview)
- [Role Hierarchy](#role-hierarchy)
- [Authentication API](#authentication-api)
- [User Management API](#user-management-api)
- [Access Control Rules](#access-control-rules)
- [Security Features](#security-features)
- [Database Schema](#database-schema)
- [Examples](#examples)

## Overview

The Users collection provides:

- **Authentication**: Login/logout with email and password
- **Authorization**: 5-tier role-based access control
- **Security**: Password hashing, complexity requirements, account lockout
- **Session Management**: Token-based authentication with configurable expiration
- **Password Reset**: Secure token-based password recovery
- **Login Tracking**: Monitor user activity (last login, login count)
- **Account Management**: Activate/deactivate user accounts

## Role Hierarchy

The system implements 5 distinct roles with escalating permissions:

### 1. Lectura (Level 1) - Read-Only Access
**Permissions:**
- Read public content (cycles, campuses, courses, blog posts)
- View own profile
- Update own profile (limited fields)

**Use Cases:**
- External consultants
- Read-only auditors
- Third-party integrations

### 2. Asesor (Level 2) - Client Data Access
**Permissions:**
- All Lectura permissions
- Read client/lead data
- Create notes and interactions
- View campaign performance

**Use Cases:**
- Sales representatives
- Customer support staff
- Account managers

### 3. Marketing (Level 3) - Content Creation
**Permissions:**
- All Asesor permissions
- Create and edit marketing campaigns
- Create and edit ad templates
- View analytics and reports
- Manage blog posts and FAQs

**Use Cases:**
- Marketing team members
- Content creators
- Social media managers

### 4. Gestor (Level 4) - System Management
**Permissions:**
- All Marketing permissions
- Create and edit users (except admin)
- Manage courses and course runs
- Moderate content
- Access audit logs

**Use Cases:**
- Operations managers
- Senior marketing managers
- Course coordinators

### 5. Admin (Level 5) - Full System Access
**Permissions:**
- All system permissions
- Create and delete users (including other admins)
- Manage user roles
- System configuration
- Access all audit logs
- Delete content

**Use Cases:**
- System administrators
- Technical team leads
- Business owners

**Important:** The system always maintains at least one admin user.

## Authentication API

### POST /api/users/login

Authenticate a user and receive an access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "YourPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Auth Passed",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "marketing",
    "is_active": true,
    "last_login_at": "2025-10-22T12:00:00Z",
    "login_count": 42,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-10-22T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "exp": 1729598400
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid credentials
- **401 Unauthorized** - Account inactive
- **429 Too Many Requests** - Account locked (5 failed attempts)

**Notes:**
- Token expires after 2 hours (7200 seconds)
- Login count and last_login_at are updated automatically
- Failed login attempts are tracked; account locks after 5 failures for 15 minutes

### POST /api/users/logout

Logout the currently authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- **401 Unauthorized** - Not authenticated

### GET /api/users/me

Get the currently authenticated user's profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "marketing",
    "avatar_url": "https://example.com/avatar.jpg",
    "phone": "+34 123 456 789",
    "is_active": true,
    "last_login_at": "2025-10-22T12:00:00Z",
    "login_count": 42,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-10-22T12:00:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized** - Not authenticated

### POST /api/users/forgot-password

Request a password reset token.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

**Notes:**
- Always returns 200 even if email doesn't exist (security: prevent email enumeration)
- Reset token expires after 1 hour
- Token is sent via email (requires email service configuration)

### POST /api/users/reset-password

Reset password using the token from forgot-password.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successful",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid or expired token
- **400 Bad Request** - Password doesn't meet complexity requirements

## User Management API

### POST /api/users

Create a new user (Admin or Gestor only).

**Headers:**
```
Authorization: Bearer {admin_or_gestor_token}
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "name": "Jane Smith",
  "role": "marketing",
  "phone": "+34 987 654 321",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_active": true
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "doc": {
    "id": "2",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "marketing",
    "phone": "+34 987 654 321",
    "avatar_url": "https://example.com/avatar.jpg",
    "is_active": true,
    "login_count": 0,
    "createdAt": "2025-10-22T12:00:00Z",
    "updatedAt": "2025-10-22T12:00:00Z"
  }
}
```

**Validation Rules:**

**Email:**
- Valid email format
- Maximum 100 characters
- Unique (enforced at database level)

**Password:**
- Minimum 8 characters, maximum 100 characters
- At least one lowercase letter (a-z)
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Name:**
- Minimum 2 characters
- Maximum 100 characters

**Role:**
- Must be one of: `admin`, `gestor`, `marketing`, `asesor`, `lectura`
- Defaults to `lectura` if not provided
- Gestor cannot create `admin` users

**Phone (optional):**
- Format: `+34 XXX XXX XXX`
- Example: `+34 123 456 789`

**Avatar URL (optional):**
- Must be a valid URL
- Maximum 500 characters

**Error Responses:**
- **400 Bad Request** - Validation error
- **401 Unauthorized** - Not authenticated
- **403 Forbidden** - Insufficient permissions
- **409 Conflict** - Email already exists

### GET /api/users

List users (filtered by role).

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` - Number of results per page (default: 10, max: 100)
- `page` - Page number (default: 1)
- `where` - JSON query filter
- `sort` - Sort field (e.g., `-createdAt` for descending)

**Response (200 OK):**
```json
{
  "docs": [
    {
      "id": "1",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "marketing",
      "is_active": true,
      "last_login_at": "2025-10-22T12:00:00Z",
      "login_count": 42,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-10-22T12:00:00Z"
    }
  ],
  "totalDocs": 15,
  "limit": 10,
  "totalPages": 2,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevPage": null,
  "nextPage": 2
}
```

**Access Control:**
- **Admin/Gestor**: See all users
- **Marketing/Asesor/Lectura**: See only themselves

**Filter Examples:**

Filter by role:
```
GET /api/users?where[role][equals]=admin
```

Filter by active status:
```
GET /api/users?where[is_active][equals]=true
```

Filter by email (partial match):
```
GET /api/users?where[email][contains]=@example.com
```

### GET /api/users/:id

Get a specific user by ID.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": "1",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "marketing",
  "avatar_url": "https://example.com/avatar.jpg",
  "phone": "+34 123 456 789",
  "is_active": true,
  "last_login_at": "2025-10-22T12:00:00Z",
  "login_count": 42,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-10-22T12:00:00Z"
}
```

**Access Control:**
- **Admin/Gestor**: Can view any user
- **Others**: Can only view themselves

**Error Responses:**
- **401 Unauthorized** - Not authenticated
- **403 Forbidden** - Cannot access this user
- **404 Not Found** - User not found

### PATCH /api/users/:id

Update a user.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "John Updated",
  "phone": "+34 111 222 333",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response (200 OK):**
```json
{
  "message": "User updated successfully",
  "doc": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Updated",
    "role": "marketing",
    "phone": "+34 111 222 333",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "is_active": true,
    "last_login_at": "2025-10-22T12:00:00Z",
    "login_count": 42,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-10-22T13:00:00Z"
  }
}
```

**Access Control:**
- **Admin**: Can update any user, any field
- **Gestor**: Can update any user except role and is_active
- **Others**: Can only update themselves (name, phone, avatar_url)

**Restricted Fields:**
- `email` - Cannot be changed (immutable)
- `role` - Only admin can change
- `is_active` - Only admin can change
- `password` - Use dedicated password reset endpoint

**Error Responses:**
- **400 Bad Request** - Validation error
- **401 Unauthorized** - Not authenticated
- **403 Forbidden** - Cannot update this user or field
- **404 Not Found** - User not found

### DELETE /api/users/:id

Delete a user (Admin only).

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response (200 OK):**
```json
{
  "id": "2",
  "message": "User deleted successfully"
}
```

**Access Control:**
- **Admin only**
- Cannot delete yourself
- Cannot delete the last admin user

**Error Responses:**
- **401 Unauthorized** - Not authenticated
- **403 Forbidden** - Not admin, trying to delete self, or deleting last admin
- **404 Not Found** - User not found

## Access Control Rules

### Collection-Level Access

| Operation | Admin | Gestor | Marketing | Asesor | Lectura |
|-----------|-------|--------|-----------|--------|---------|
| Read All  | ✅    | ✅     | ❌ (Self) | ❌ (Self) | ❌ (Self) |
| Create    | ✅    | ✅ *   | ❌        | ❌     | ❌      |
| Update    | ✅    | ✅ **  | ❌ (Self) | ❌ (Self) | ❌ (Self) |
| Delete    | ✅    | ❌     | ❌        | ❌     | ❌      |

\* Gestor can create non-admin users only
\** Gestor cannot change role or is_active fields

### Field-Level Access

| Field       | Read | Create        | Update (Admin) | Update (Others) |
|-------------|------|---------------|----------------|-----------------|
| email       | ✅   | ✅            | ❌             | ❌              |
| password    | ❌   | ✅            | ✅ (via reset) | ✅ (via reset)  |
| name        | ✅   | ✅            | ✅             | ✅              |
| role        | ✅   | ✅            | ✅             | ❌              |
| avatar_url  | ✅   | ✅            | ✅             | ✅              |
| phone       | ✅   | ✅            | ✅             | ✅              |
| is_active   | ✅   | ✅            | ✅             | ❌              |
| last_login  | ✅   | ❌            | ❌             | ❌              |
| login_count | ✅   | ❌            | ❌             | ❌              |

### Business Rules

1. **Self-Management**
   - Users cannot change their own role
   - Users cannot deactivate themselves
   - Users cannot delete themselves

2. **Admin Protection**
   - At least one admin must exist at all times
   - Cannot demote the last admin
   - Cannot delete the last admin

3. **Email Uniqueness**
   - Email addresses must be unique across all users
   - Email cannot be changed after account creation

4. **Account Security**
   - Password must meet complexity requirements
   - Failed login attempts trigger account lockout (5 attempts = 15 min lockout)
   - Passwords are hashed using bcrypt (handled by Payload)
   - Session tokens expire after 2 hours

## Security Features

### Password Security

1. **Complexity Requirements**
   - Minimum 8 characters
   - Maximum 100 characters
   - At least one lowercase letter
   - At least one uppercase letter
   - At least one number
   - At least one special character

2. **Storage**
   - Passwords are hashed using bcrypt
   - Original passwords are never stored
   - Passwords are never exposed in API responses

3. **Reset Flow**
   - Token-based password reset
   - Tokens expire after 1 hour
   - Tokens are single-use only

### Account Lockout

After 5 failed login attempts:
- Account is locked for 15 minutes
- Subsequent login attempts during lockout return 429 (Too Many Requests)
- Lockout resets after 15 minutes or successful password reset

### Session Management

- Token-based authentication using JWT
- Tokens expire after 2 hours (configurable)
- Logout invalidates the token immediately
- Tokens include user ID, role, and expiration

### Login Tracking

Each successful login records:
- `last_login_at` - Timestamp of most recent login
- `login_count` - Total number of successful logins

This data is useful for:
- Security auditing
- User activity monitoring
- Detecting compromised accounts

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'gestor', 'marketing', 'asesor', 'lectura')),
  avatar_url TEXT,
  phone TEXT,
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  reset_password_token TEXT,
  reset_password_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_reset_password_token ON users(reset_password_token);
```

## Examples

### Complete User Lifecycle

**1. Create User (Admin)**
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "New User",
    "role": "marketing"
  }'
```

**2. User Logs In**
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'
```

**3. User Updates Profile**
```bash
curl -X PATCH http://localhost:3001/api/users/1 \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "+34 123 456 789"
  }'
```

**4. User Forgets Password**
```bash
curl -X POST http://localhost:3001/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com"
  }'
```

**5. User Resets Password**
```bash
curl -X POST http://localhost:3001/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "NewSecurePass123!"
  }'
```

**6. Admin Deactivates User**
```bash
curl -X PATCH http://localhost:3001/api/users/1 \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

**7. Admin Deletes User**
```bash
curl -X DELETE http://localhost:3001/api/users/1 \
  -H "Authorization: Bearer {admin_token}"
```

### Query Examples

**Get all admin users:**
```bash
curl -X GET "http://localhost:3001/api/users?where[role][equals]=admin" \
  -H "Authorization: Bearer {admin_token}"
```

**Get active users only:**
```bash
curl -X GET "http://localhost:3001/api/users?where[is_active][equals]=true" \
  -H "Authorization: Bearer {admin_token}"
```

**Get users sorted by last login (most recent first):**
```bash
curl -X GET "http://localhost:3001/api/users?sort=-last_login_at" \
  -H "Authorization: Bearer {admin_token}"
```

**Get marketing team members:**
```bash
curl -X GET "http://localhost:3001/api/users?where[role][equals]=marketing" \
  -H "Authorization: Bearer {admin_token}"
```

## Testing

The Users collection includes comprehensive test coverage (>80%):

**Test Categories:**
- Authentication (login, logout, me, forgot-password, reset-password)
- CRUD operations (create, read, update, delete)
- Role-based access control (all 5 roles tested)
- Security (password hashing, complexity, lockout)
- Business logic (cannot delete self, cannot change own role, at least one admin)
- Validation (email, password, phone, avatar URL)

**Run tests:**
```bash
pnpm test:cms
```

**Run with coverage:**
```bash
pnpm test:coverage
```

## Related Documentation

- [TDD Implementation Summary](./IMPLEMENTATION.md)
- [Payload Auth Documentation](https://payloadcms.com/docs/authentication/overview)
- [Access Control Guide](../../docs/ACCESS_CONTROL.md)

## Support

For issues or questions:
- Create an issue in GitHub
- Contact the development team
- Review test cases for usage examples

# ADR-002: Authentication Strategy

**Status:** Accepted
**Date:** 2026-01-27
**Decision Makers:** Engineering Team

## Context

Akademate.com requires authentication for multiple user types:

- **Admin users:** Platform administrators and tenant managers
- **Students:** LMS learners accessing campus app
- **API clients:** External integrations

We needed a solution that:
- Integrates with Payload CMS
- Supports HTTP-only cookies for browser security
- Enables JWT for API access
- Works across multiple apps (admin, campus, web)

## Decision

We use **Payload CMS native authentication** with JWT tokens stored in HTTP-only cookies.

### Implementation Details

1. **Auth Collection** (`apps/tenant-admin/src/collections/Users/Users.ts`)
   - Payload CMS `auth: true` enables built-in authentication
   - Password hashing, token generation handled by Payload

2. **Token Strategy**
   | Context | Token Storage | Expiry |
   |---------|---------------|--------|
   | Admin UI | HTTP-only cookie `payload-token` | 2 hours |
   | Campus App | JWT in localStorage + refresh | 24 hours |
   | API | Bearer token in Authorization header | 1 hour |

3. **Session Flow (Admin)**
   ```
   Browser → POST /api/users/login → Payload validates
                                   → Sets payload-token cookie
                                   → Returns user + token
   ```

4. **Campus App Flow**
   ```
   App → POST /api/campus/login → Validate student credentials
                                → Generate JWT (custom secret)
                                → Return access + refresh tokens
   ```

5. **Middleware Protection** (`apps/tenant-admin/middleware.ts`)
   - Validates `payload-token` cookie
   - Redirects unauthenticated to `/auth/login`
   - CORS configured for known origins

## Alternatives Considered

### 1. NextAuth.js
- **Pros:** Mature, many providers, session management
- **Cons:** Doesn't integrate cleanly with Payload CMS auth
- **Rejected:** Would duplicate auth logic, increase complexity

### 2. Auth0/Clerk (External Provider)
- **Pros:** Enterprise features, MFA, audit logs
- **Cons:** Vendor lock-in, additional cost, latency
- **Rejected:** Budget constraints, Payload already has auth

### 3. Custom JWT Implementation
- **Pros:** Full control
- **Cons:** Security risk, reinventing the wheel
- **Rejected:** Payload already handles this securely

### 4. Payload Native Auth (Chosen)
- **Pros:** Zero additional dependencies, Payload handles security
- **Cons:** Less flexible than dedicated auth service
- **Accepted:** Best fit for current requirements

## Consequences

### Positive
- Single source of truth for user credentials
- HTTP-only cookies prevent XSS token theft
- Payload handles password hashing (bcrypt)
- Built-in token refresh mechanism

### Negative
- Campus app requires separate JWT handling
- No built-in MFA (future enhancement)
- Session invalidation requires custom logic

### Security Measures
- Rate limiting on login endpoints (10 req/min)
- Secure cookie flags in production
- CORS restricted to known origins
- CSRF protection via SameSite cookies

## Configuration

### Environment Variables
```bash
PAYLOAD_SECRET=<32+ char secret>
CAMPUS_JWT_SECRET=<32+ char secret>
```

### Cookie Settings (Production)
```typescript
{
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/'
}
```

## Verification

Test authentication flow:
```bash
# Admin login
curl -X POST http://localhost:3002/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test"}'

# Campus login
curl -X POST http://localhost:3002/api/campus/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"test"}'
```

## Future Considerations

- MFA implementation (TOTP/WebAuthn)
- OAuth2 providers for social login
- API key management for external integrations

## References

- `apps/tenant-admin/src/collections/Users/Users.ts` - User collection
- `apps/tenant-admin/middleware.ts` - Auth middleware
- `apps/tenant-admin/app/api/campus/login/route.ts` - Campus auth endpoint
- Payload CMS Auth Docs: https://payloadcms.com/docs/authentication

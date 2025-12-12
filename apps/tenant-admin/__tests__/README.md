# Test Suite Documentation

## Overview
Comprehensive test suite for CEP Admin CMS covering authentication, administration, configuration, and UI components.

## Test Structure

```
__tests__/
├── administracion/
│   ├── usuarios.test.tsx      # User management tests (5 cases)
│   ├── roles.test.tsx         # Roles & permissions tests (4 cases)
│   └── actividad.test.tsx     # Activity log tests (5 cases)
├── configuracion/
│   ├── personalizacion.test.tsx  # Theme customization tests (6 cases)
│   ├── general.test.tsx          # General config tests (6 cases)
│   ├── areas.test.tsx            # Study areas tests (5 cases)
│   └── apis.test.tsx             # APIs & webhooks tests (8 cases)
├── components/
│   ├── LogoutButton.test.tsx  # Logout component tests (3 cases)
│   └── ChatbotWidget.test.tsx # Chatbot widget tests (5 cases)
├── lib/
│   └── auth.test.ts           # Auth helpers tests (3 cases)
├── login.test.tsx             # Login page tests (6 cases)
├── forgot-password.test.tsx   # Password recovery tests (4 cases)
├── ayuda.test.tsx             # Help page tests (7 cases)
└── setup.ts                   # Jest setup configuration
```

## Test Coverage

| Module | Test Files | Test Cases | Coverage |
|--------|-----------|------------|----------|
| **Authentication** | 3 | 13 | Core auth flows |
| **Administration** | 3 | 14 | User, roles, activity |
| **Configuration** | 4 | 25 | Settings, APIs, theme |
| **Components** | 2 | 8 | UI components |
| **Help** | 1 | 7 | Documentation |
| **Total** | 13 | 67 | Comprehensive |

## Running Tests

```bash
# Run all tests
pnpm --filter cms test

# Run tests in watch mode
pnpm --filter cms test:watch

# Run with coverage
pnpm --filter cms test:coverage

# Run specific test file
pnpm --filter cms test login.test

# Run tests for specific module
pnpm --filter cms test administracion
```

## Test Categories

### 1. Authentication Tests
- Login flow validation
- Password recovery
- Logout functionality
- Auth helper utilities

### 2. Administration Tests
- User CRUD operations
- Role-based permissions
- Activity logging and audit trail

### 3. Configuration Tests
- General settings management
- Theme customization (real-time)
- Study areas CRUD with protection
- API integrations (Facebook Pixel, GA4, MCP)

### 4. Component Tests
- LogoutButton: Session management
- ChatbotWidget: AI assistant interaction
- Responsive UI behaviors

### 5. Integration Tests
- Full user workflows
- Multi-step processes
- State management

## Test Conventions

- **Naming**: `[feature].test.tsx` or `[component].test.tsx`
- **Structure**: Describe blocks for logical grouping
- **Assertions**: Use specific, meaningful expectations
- **Mocking**: Mock external dependencies (router, localStorage, APIs)
- **Cleanup**: Clear state between tests (`beforeEach`)

## Coverage Goals

- **Statements**: ≥ 50%
- **Branches**: ≥ 50%
- **Functions**: ≥ 50%
- **Lines**: ≥ 50%

Target: Increase to 75%+ for critical auth and RBAC modules.

## Dependencies

```json
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/user-event": "^14.0.0",
  "jest": "^29.0.0",
  "jest-environment-jsdom": "^29.0.0"
}
```

## CI/CD Integration

Tests run automatically on:
- Pre-commit hooks (via Husky)
- Pull requests (via GitHub Actions)
- Pre-push validation

## Writing New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `[feature].test.tsx`
3. Use describe/it structure
4. Mock external dependencies
5. Test happy path + error cases
6. Add to this documentation

## Troubleshooting

**Issue**: Tests fail with module not found
**Solution**: Check `moduleNameMapper` in jest.config.js

**Issue**: localStorage not available
**Solution**: Ensure setup.ts mocks localStorage

**Issue**: Next.js router errors
**Solution**: Mock `next/navigation` in test file

---

**Last Updated**: 2025-01-15
**Total Test Cases**: 67
**Maintainer**: CEP Admin Team

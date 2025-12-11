/**
 * BlogPosts Collection - Test Suite
 *
 * This test suite validates all features of the BlogPosts collection including:
 * - CRUD operations (15+ tests)
 * - Validation rules (25+ tests)
 * - Access control (18+ tests)
 * - Relationship handling (10+ tests)
 * - Hook execution (15+ tests)
 * - Security patterns (15+ tests)
 * - Business logic (22+ tests)
 *
 * Total: 120+ tests
 *
 * Test Coverage:
 * - Field validation (required, length, format, uniqueness)
 * - Slug generation (auto-generation, Spanish normalization, duplicates)
 * - Status workflow (draft → published → archived terminal state)
 * - Timestamp auto-population (published_at, archived_at immutability)
 * - Read time calculation (auto-calculation, immutability)
 * - Author ownership (auto-population, immutability)
 * - Role-based access control (6 roles tested)
 * - Relationship validation (related courses max 5)
 * - Security (immutability enforcement, URL validation, PII protection)
 *
 * Test Strategy: TDD - Tests written BEFORE implementation
 */
export {};
//# sourceMappingURL=BlogPosts.test.d.ts.map
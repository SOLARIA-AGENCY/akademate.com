/**
 * AKADEMATE.COM - RLS Module
 *
 * Row Level Security (RLS) utilities for multi-tenant data isolation.
 *
 * @module @akademate/db/rls
 */

export {
  withTenantContext,
  withTenantRead,
  getCurrentTenantId,
  assertTenantContext,
  isValidTenantId,
  type TenantContext,
  type TenantScopedResult,
} from './withTenantContext'

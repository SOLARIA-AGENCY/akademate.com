import { describe, expect, it } from 'vitest'
import { apiKeys, auditLogs, courses, featureFlags, memberships, subscriptions, tenants, users, webhooks } from '../src/schema'

const hasColumn = (table: any, column: string) => Boolean(table?.[column])

describe('db schema', () => {
  it('tenants has plan/status/mrr/branding/domains', () => {
    expect(hasColumn(tenants, 'plan')).toBe(true)
    expect(hasColumn(tenants, 'status')).toBe(true)
    expect(hasColumn(tenants, 'mrr')).toBe(true)
    expect(hasColumn(tenants, 'branding')).toBe(true)
    expect(hasColumn(tenants, 'domains')).toBe(true)
  })

  it('users has auth fields', () => {
    expect(hasColumn(users, 'email')).toBe(true)
    expect(hasColumn(users, 'passwordHash')).toBe(true)
    expect(hasColumn(users, 'mfaEnabled')).toBe(true)
  })

  it('memberships link user and tenant with roles', () => {
    expect(hasColumn(memberships, 'userId')).toBe(true)
    expect(hasColumn(memberships, 'tenantId')).toBe(true)
    expect(hasColumn(memberships, 'roles')).toBe(true)
  })

  it('api keys include scopes and status', () => {
    expect(hasColumn(apiKeys, 'key')).toBe(true)
    expect(hasColumn(apiKeys, 'scopes')).toBe(true)
    expect(hasColumn(apiKeys, 'status')).toBe(true)
  })

  it('feature flags include defaultValue and overrides', () => {
    expect(hasColumn(featureFlags, 'defaultValue')).toBe(true)
    expect(hasColumn(featureFlags, 'overrides')).toBe(true)
  })

  it('audit logs include resource tracking', () => {
    expect(hasColumn(auditLogs, 'action')).toBe(true)
    expect(hasColumn(auditLogs, 'resource')).toBe(true)
    expect(hasColumn(auditLogs, 'resourceId')).toBe(true)
  })

  it('subscriptions include plan, status and usageMeter', () => {
    expect(hasColumn(subscriptions, 'plan')).toBe(true)
    expect(hasColumn(subscriptions, 'status')).toBe(true)
    expect(hasColumn(subscriptions, 'usageMeter')).toBe(true)
  })

  it('webhooks include events and secret', () => {
    expect(hasColumn(webhooks, 'events')).toBe(true)
    expect(hasColumn(webhooks, 'secret')).toBe(true)
  })

  it('courses are tenant scoped', () => {
    expect(hasColumn(courses, 'tenantId')).toBe(true)
  })
})

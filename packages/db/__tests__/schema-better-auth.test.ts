import { describe, it, expect } from 'vitest'
import { sessions, accounts, verifications, schema } from '../src/schema'

const hasColumn = (table: any, column: string) => Boolean(table?.[column])

describe('Better Auth schema tables', () => {
  it('exports sessions table', () => {
    expect(schema.sessions).toBeDefined()
  })

  it('exports accounts table', () => {
    expect(schema.accounts).toBeDefined()
  })

  it('exports verifications table', () => {
    expect(schema.verifications).toBeDefined()
  })

  it('sessions references users', () => {
    expect(hasColumn(sessions, 'userId')).toBe(true)
  })

  it('accounts has providerId and accountId', () => {
    expect(hasColumn(accounts, 'providerId')).toBe(true)
    expect(hasColumn(accounts, 'accountId')).toBe(true)
  })

  it('verifications has identifier and value', () => {
    expect(hasColumn(verifications, 'identifier')).toBe(true)
    expect(hasColumn(verifications, 'value')).toBe(true)
  })
})

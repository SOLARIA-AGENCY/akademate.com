import { describe, expect, it } from 'vitest'
import { canCreateStudent } from '@/src/collections/Students/access/canCreateStudent'
import { canDeleteStudent } from '@/src/collections/Students/access/canDeleteStudent'
import { canReadStudents } from '@/src/collections/Students/access/canReadStudents'
import { canUpdateStudent } from '@/src/collections/Students/access/canUpdateStudent'

function accessArgs(user: unknown) {
  return {
    req: {
      user,
    },
  } as any
}

describe('Students collection tenant access', () => {
  it('denies public access', () => {
    expect(canReadStudents(accessArgs(null))).toBe(false)
    expect(canCreateStudent(accessArgs(null))).toBe(false)
    expect(canUpdateStudent(accessArgs(null))).toBe(false)
    expect(canDeleteStudent(accessArgs(null))).toBe(false)
  })

  it('filters readable students by user tenant', () => {
    expect(canReadStudents(accessArgs({ role: 'admin', tenant: 4 }))).toEqual({
      tenant: {
        equals: 4,
      },
    })
  })

  it('filters update and delete operations by user tenant', () => {
    expect(canUpdateStudent(accessArgs({ role: 'gestor', tenant: 4 }))).toEqual({
      tenant: {
        equals: 4,
      },
    })
    expect(canDeleteStudent(accessArgs({ role: 'admin', tenant: 4 }))).toEqual({
      tenant: {
        equals: 4,
      },
    })
  })

  it('denies tenant-scoped roles without tenant assignment', () => {
    expect(canReadStudents(accessArgs({ role: 'admin' }))).toBe(false)
    expect(canCreateStudent(accessArgs({ role: 'gestor' }))).toBe(false)
    expect(canUpdateStudent(accessArgs({ role: 'gestor' }))).toBe(false)
    expect(canDeleteStudent(accessArgs({ role: 'admin' }))).toBe(false)
  })

  it('allows superadmin across tenants', () => {
    expect(canReadStudents(accessArgs({ role: 'superadmin' }))).toBe(true)
    expect(canCreateStudent(accessArgs({ role: 'superadmin' }))).toBe(true)
    expect(canUpdateStudent(accessArgs({ role: 'superadmin' }))).toBe(true)
    expect(canDeleteStudent(accessArgs({ role: 'superadmin' }))).toBe(true)
  })
})

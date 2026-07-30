import assert from 'node:assert/strict'
import test from 'node:test'

import { hasLearningCapability, resolveLearningAccess } from './access.ts'

const principal = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  active: true,
} as const

const context = {
  tenantId: 'tenant-1',
  courseRunId: 'run-1',
  now: '2026-07-30T10:00:00.000Z',
} as const

test('grants an assigned instructor teaching capabilities but not student submission', () => {
  const access = resolveLearningAccess({
    principal,
    context,
    membership: {
      userId: 'user-1',
      tenantId: 'tenant-1',
      courseRunId: 'run-1',
      role: 'instructor',
      status: 'active',
      staffProfileId: 'staff-1',
    },
  })

  assert.equal(access.allowed, true)
  assert.equal(hasLearningCapability(access, 'course.author'), true)
  assert.equal(hasLearningCapability(access, 'submission.review'), true)
  assert.equal(hasLearningCapability(access, 'grade.publish'), true)
  assert.equal(hasLearningCapability(access, 'assignment.submit'), false)
})

test('grants an enrolled student learning capabilities but never grading', () => {
  const access = resolveLearningAccess({
    principal,
    context,
    membership: {
      userId: 'user-1',
      tenantId: 'tenant-1',
      courseRunId: 'run-1',
      role: 'student',
      status: 'active',
      studentProfileId: 'student-1',
    },
  })

  assert.equal(access.allowed, true)
  assert.equal(hasLearningCapability(access, 'course.consume'), true)
  assert.equal(hasLearningCapability(access, 'assignment.submit'), true)
  assert.equal(hasLearningCapability(access, 'grade.read-published'), true)
  assert.equal(hasLearningCapability(access, 'grade.record'), false)
})

test('denies cross-tenant, cross-user and cross-course memberships fail-closed', () => {
  const baseMembership = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    courseRunId: 'run-1',
    role: 'student',
    status: 'active',
    studentProfileId: 'student-1',
  } as const

  const cases = [
    { membership: { ...baseMembership, tenantId: 'tenant-2' }, reason: 'tenant_mismatch' },
    { membership: { ...baseMembership, userId: 'user-2' }, reason: 'user_mismatch' },
    { membership: { ...baseMembership, courseRunId: 'run-2' }, reason: 'course_run_mismatch' },
  ]

  for (const item of cases) {
    const access = resolveLearningAccess({ principal, context, membership: item.membership })
    assert.deepEqual(access, { allowed: false, reason: item.reason, capabilities: [] })
  }
})

test('denies inactive principals and inactive or expired memberships', () => {
  const membership = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    courseRunId: 'run-1',
    role: 'student',
    status: 'active',
    studentProfileId: 'student-1',
  } as const

  assert.equal(resolveLearningAccess({ principal: { ...principal, active: false }, context, membership }).reason, 'principal_inactive')
  assert.equal(resolveLearningAccess({ principal, context, membership: { ...membership, status: 'suspended' } }).reason, 'membership_inactive')
  assert.equal(resolveLearningAccess({ principal, context, membership: { ...membership, validUntil: '2026-07-29T00:00:00.000Z' } }).reason, 'membership_expired')
  assert.equal(resolveLearningAccess({ principal, context, membership: { ...membership, validFrom: '2026-08-01T00:00:00.000Z' } }).reason, 'membership_not_started')
})

test('requires the role-specific profile and does not grant administrators an implicit bypass', () => {
  const instructorWithoutProfile = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    courseRunId: 'run-1',
    role: 'instructor',
    status: 'active',
  } as const
  const studentWithoutProfile = { ...instructorWithoutProfile, role: 'student' } as const

  assert.equal(resolveLearningAccess({ principal, context, membership: instructorWithoutProfile }).reason, 'staff_profile_required')
  assert.equal(resolveLearningAccess({ principal, context, membership: studentWithoutProfile }).reason, 'student_profile_required')
  assert.deepEqual(
    resolveLearningAccess({ principal: { ...principal, platformRole: 'admin' }, context, membership: null }),
    { allowed: false, reason: 'membership_required', capabilities: [] },
  )
})

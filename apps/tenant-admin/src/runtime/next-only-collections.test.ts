import assert from 'node:assert/strict'
import test from 'node:test'

import { nextCollectionConfigs as nextOnlyCollections } from './next-collection-configs.ts'

const EXPECTED_SLUGS = [
  'tenants',
  'users',
  'courses',
  'course-runs',
  'students',
  'staff',
  'campuses',
  'signage-displays',
  'signage-playlists',
  'signage-playlist-items',
  'signage-publications',
  'signage-device-principals',
  'learning-memberships',
  'learning-conversations',
  'learning-conversation-participants',
  'learning-messages',
  'learning-assignments',
  'learning-submissions',
  'learning-grades',
]

test('registers the exact minimal Next collection manifest', () => {
  assert.deepEqual(
    nextOnlyCollections.map(({ slug }) => slug),
    EXPECTED_SLUGS
  )
  assert.equal(new Set(EXPECTED_SLUGS).size, EXPECTED_SLUGS.length)
})

test('keeps every generic collection operation deny-all until command endpoints exist', async () => {
  for (const collection of nextOnlyCollections) {
    for (const operation of ['read', 'create', 'update', 'delete'] as const) {
      const access = collection.access?.[operation]
      assert.equal(typeof access, 'function', `${collection.slug}.${operation} must define access`)
      assert.equal(
        await access?.({ req: { user: { id: 1 } } } as never),
        false,
        `${collection.slug}.${operation} must fail closed`
      )
    }
  }
})

test('does not register legacy or CEP-only collection slugs', () => {
  const slugs = new Set(nextOnlyCollections.map(({ slug }) => slug))
  for (const forbidden of [
    'submissions',
    'campus-enrollments',
    'planning-conflicts',
    'course-run-sessions',
    'badges',
    'api-keys',
    'course-types',
  ]) {
    assert.equal(slugs.has(forbidden), false)
  }
})

test('declares the identity links required by learning memberships', () => {
  const students = nextOnlyCollections.find(({ slug }) => slug === 'students')
  const staff = nextOnlyCollections.find(({ slug }) => slug === 'staff')

  for (const collection of [students, staff]) {
    const names = collection?.fields.map((field) => ('name' in field ? field.name : null))
    assert.ok(names?.includes('tenant'))
    assert.ok(names?.includes('user_account'))
  }
})

test('uses the physical baseline course name column instead of a shadow title field', () => {
  const courses = nextOnlyCollections.find(({ slug }) => slug === 'courses')
  const names = courses?.fields.map((field) => ('name' in field ? field.name : null))
  assert.ok(names?.includes('name'))
  assert.equal(names?.includes('title'), false)
})

test('models offer conversion on each course run, not on the reusable course master', () => {
  const courses = nextOnlyCollections.find(({ slug }) => slug === 'courses')
  const courseRuns = nextOnlyCollections.find(({ slug }) => slug === 'course-runs')
  const courseFields = new Set(
    courses?.fields.map((field) => ('name' in field ? field.name : null))
  )
  const runFields = new Set(
    courseRuns?.fields.map((field) => ('name' in field ? field.name : null))
  )

  for (const field of [
    'publication_access',
    'conversion_mode',
    'share_slug',
    'form_template_key',
    'external_action_url',
    'payment_plan',
    'offer_price_amount',
    'deposit_amount',
    'cta_label',
    'capacity_policy',
  ]) {
    assert.equal(runFields.has(field), true, `course-runs must declare ${field}`)
    assert.equal(courseFields.has(field), false, `courses must not declare ${field}`)
  }
})

test('fails closed when a partial course-run update conflicts with stored offer settings', async () => {
  const courseRuns = nextOnlyCollections.find(({ slug }) => slug === 'course-runs')
  const hook = courseRuns?.hooks?.beforeValidate?.[0]
  assert.equal(typeof hook, 'function')

  await assert.rejects(async () =>
    hook?.({
      data: { payment_plan: 'full_amount' },
      originalDoc: {
        publication_access: 'public',
        share_slug: 'free-workshop',
        conversion_mode: 'free_registration',
        capacity_policy: 'limited',
      },
    } as never)
  )
})

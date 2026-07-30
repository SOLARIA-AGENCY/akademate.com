import assert from 'node:assert/strict'
import test from 'node:test'

import {
  loadNextRuntimeCollections,
  selectRuntimeCollections,
} from './select-runtime-collections.ts'

type TestCollection = { slug: string }

const baseCollections: TestCollection[] = [
  { slug: 'tenants' },
  { slug: 'users' },
]

const nextOnlyCollections: TestCollection[] = [
  { slug: 'learning-memberships' },
  { slug: 'learning-conversations' },
  { slug: 'learning-conversation-participants' },
  { slug: 'learning-messages' },
  { slug: 'learning-assignments' },
  { slug: 'learning-submissions' },
  { slug: 'learning-grades' },
]

test('registers Next-only collections for the exact next runtime marker', () => {
  assert.deepEqual(
    selectRuntimeCollections('next', baseCollections, nextOnlyCollections).map(({ slug }) => slug),
    [...baseCollections, ...nextOnlyCollections].map(({ slug }) => slug),
  )
})

test('registers no Next-only collections when the runtime marker is absent', () => {
  assert.deepEqual(selectRuntimeCollections(undefined, baseCollections, nextOnlyCollections), baseCollections)
  assert.deepEqual(selectRuntimeCollections('', baseCollections, nextOnlyCollections), baseCollections)
})

test('registers no Next-only collections for CEP or unknown runtime markers', () => {
  const legacyCollections = [{ slug: 'legacy-shadow' }]
  for (const runtime of ['cep', 'production', 'NEXT', ' next ', 'tenant']) {
    const selected = selectRuntimeCollections(
      runtime,
      baseCollections,
      nextOnlyCollections,
      legacyCollections,
    )
    assert.deepEqual(
      selected,
      [...baseCollections, ...legacyCollections],
      `runtime ${JSON.stringify(runtime)} must fail closed`,
    )
  }
})

test('never registers legacy or CEP collections in the Next runtime', () => {
  const legacyCollections = [{ slug: 'cep-shadow' }]
  const selected = selectRuntimeCollections(
    'next',
    baseCollections,
    nextOnlyCollections,
    legacyCollections,
  )

  assert.equal(selected.some(({ slug }) => slug.includes('cep')), false)
  assert.deepEqual(selected, [...baseCollections, ...nextOnlyCollections])
})

test('returns a new array without mutating either collection source', () => {
  const selected = selectRuntimeCollections('next', baseCollections, nextOnlyCollections)

  assert.notEqual(selected, baseCollections)
  assert.notEqual(selected, nextOnlyCollections)
  assert.deepEqual(baseCollections.map(({ slug }) => slug), ['tenants', 'users'])
  assert.equal(nextOnlyCollections.length, 7)
})

test('does not evaluate the Next collection loader outside the exact next runtime', async () => {
  for (const runtime of [undefined, '', 'cep', 'NEXT', ' next ', 'production']) {
    let evaluated = false
    const selected = await loadNextRuntimeCollections(runtime, async () => {
      evaluated = true
      return nextOnlyCollections
    })

    assert.equal(evaluated, false, `runtime ${JSON.stringify(runtime)} must not evaluate Next code`)
    assert.deepEqual(selected, [])
  }
})

test('evaluates the Next collection loader once for the exact next runtime', async () => {
  let evaluations = 0
  const selected = await loadNextRuntimeCollections('next', async () => {
    evaluations += 1
    return nextOnlyCollections
  })

  assert.equal(evaluations, 1)
  assert.deepEqual(selected, nextOnlyCollections)
  assert.notEqual(selected, nextOnlyCollections)
})

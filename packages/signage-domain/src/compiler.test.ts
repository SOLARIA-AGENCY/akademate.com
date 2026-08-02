import assert from 'node:assert/strict'
import test from 'node:test'

import { SignageCompileError, compilePlaylist } from './compiler.ts'
import type { SignagePlaylist } from './types.ts'

const basePlaylist: SignagePlaylist = {
  id: 'playlist-reception',
  tenantId: 'tenant-a',
  siteId: 'site-stockholm',
  timezone: 'Europe/Stockholm',
  revision: 7,
  items: [
    {
      id: 'item-class-calendar',
      tenantId: 'tenant-a',
      siteId: 'site-stockholm',
      assetId: 'asset-calendar',
      durationSeconds: 20,
      priority: 10,
      position: 2,
    },
    {
      id: 'item-welcome',
      tenantId: 'tenant-a',
      siteId: 'site-stockholm',
      assetId: 'asset-welcome',
      durationSeconds: 15,
      priority: 20,
      position: 1,
    },
  ],
}

test('compiles the same canonical input structurally identically in one runtime', () => {
  const input = {
    playlist: basePlaylist,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-10-24T10:00:00.000Z',
  } as const

  const first = compilePlaylist(input)
  const second = compilePlaylist(input)

  assert.deepEqual(first, second)
  assert.deepEqual(
    first.items.map((item) => item.id),
    ['item-welcome', 'item-class-calendar'],
  )
  assert.equal(first.manifestKey, 'tenant-a/site-stockholm/playlist-reception/r7/2026-10-24T10:00:00.000Z')
})

test('fails closed when an item crosses the requested tenant or site boundary', () => {
  const tampered: SignagePlaylist = {
    ...basePlaylist,
    items: [{ ...basePlaylist.items[0]!, tenantId: 'tenant-b' }],
  }

  assert.throws(
    () =>
      compilePlaylist({
        playlist: tampered,
        tenantId: 'tenant-a',
        siteId: 'site-stockholm',
        at: '2026-10-24T10:00:00.000Z',
      }),
    (error: unknown) =>
      error instanceof SignageCompileError && error.code === 'SCOPE_MISMATCH',
  )
})

test('reports active position collisions while keeping a stable id tie-breaker', () => {
  const overlapping: SignagePlaylist = {
    ...basePlaylist,
    items: [
      { ...basePlaylist.items[0]!, id: 'item-z', position: 1, priority: 10 },
      { ...basePlaylist.items[1]!, id: 'item-a', position: 1, priority: 10 },
    ],
  }

  const manifest = compilePlaylist({
    playlist: overlapping,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-10-24T10:00:00.000Z',
  })

  assert.deepEqual(manifest.items.map((item) => item.id), ['item-a', 'item-z'])
  assert.deepEqual(manifest.collisions, [
    { position: 1, priority: 10, itemIds: ['item-a', 'item-z'] },
  ])
})

test('uses locale-independent ordering for canonical ASCII identifiers', () => {
  const caseVariant: SignagePlaylist = {
    ...basePlaylist,
    items: [
      { ...basePlaylist.items[0]!, id: 'item-a', position: 1, priority: 10 },
      { ...basePlaylist.items[1]!, id: 'item-A', position: 1, priority: 10 },
    ],
  }

  const manifest = compilePlaylist({
    playlist: caseVariant,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-10-24T10:00:00.000Z',
  })

  assert.deepEqual(manifest.items.map((item) => item.id), ['item-A', 'item-a'])
  assert.deepEqual(manifest.collisions[0]?.itemIds, ['item-A', 'item-a'])
})

test('evaluates an overnight local schedule on its start day', () => {
  const overnight: SignagePlaylist = {
    ...basePlaylist,
    timezone: 'Europe/Madrid',
    items: [
      {
        ...basePlaylist.items[0]!,
        schedule: { daysOfWeek: [6], startMinute: 22 * 60, endMinute: 2 * 60 },
      },
    ],
  }

  const activeAfterMidnight = compilePlaylist({
    playlist: overnight,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-10-24T23:30:00.000Z',
  })
  const inactiveFollowingNight = compilePlaylist({
    playlist: overnight,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-10-25T23:30:00.000Z',
  })

  assert.equal(activeAfterMidnight.items.length, 1)
  assert.equal(inactiveFollowingNight.items.length, 0)
})

test('uses the IANA timezone at the requested instant across a DST transition', () => {
  const dstWindow: SignagePlaylist = {
    ...basePlaylist,
    timezone: 'Europe/Stockholm',
    items: [
      {
        ...basePlaylist.items[0]!,
        schedule: { daysOfWeek: [0], startMinute: 2 * 60, endMinute: 3 * 60 },
      },
    ],
  }

  const firstOccurrence = compilePlaylist({
    playlist: dstWindow,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-10-25T00:30:00.000Z',
  })
  const secondOccurrence = compilePlaylist({
    playlist: dstWindow,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-10-25T01:30:00.000Z',
  })

  assert.equal(firstOccurrence.items.length, 1)
  assert.equal(secondOccurrence.items.length, 1)
  assert.equal(firstOccurrence.localTime.minuteOfDay, secondOccurrence.localTime.minuteOfDay)
})

test('keeps a spring-forward gap inactive at its half-open boundaries', () => {
  const springForward: SignagePlaylist = {
    ...basePlaylist,
    timezone: 'Europe/Stockholm',
    items: [{
      ...basePlaylist.items[0]!,
      schedule: { daysOfWeek: [0], startMinute: 2 * 60, endMinute: 3 * 60 },
    }],
  }
  const beforeGap = compilePlaylist({
    playlist: springForward,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-03-29T00:59:00.000Z',
  })
  const afterGap = compilePlaylist({
    playlist: springForward,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-03-29T01:00:00.000Z',
  })

  assert.equal(beforeGap.localTime.minuteOfDay, 119)
  assert.equal(afterGap.localTime.minuteOfDay, 180)
  assert.equal(beforeGap.items.length, 0)
  assert.equal(afterGap.items.length, 0)
})

test('keeps overlapping active windows and reports playback-position collisions', () => {
  const overlapping: SignagePlaylist = {
    ...basePlaylist,
    timezone: 'UTC',
    items: [
      {
        ...basePlaylist.items[0]!, id: 'item-a', priority: 10, position: 1,
        schedule: { daysOfWeek: [6], startMinute: 9 * 60, endMinute: 12 * 60 },
      },
      {
        ...basePlaylist.items[1]!, id: 'item-b', priority: 10, position: 1,
        schedule: { daysOfWeek: [6], startMinute: 10 * 60, endMinute: 13 * 60 },
      },
    ],
  }

  const manifest = compilePlaylist({
    playlist: overlapping,
    tenantId: 'tenant-a',
    siteId: 'site-stockholm',
    at: '2026-10-24T10:00:00.000Z',
  })

  assert.deepEqual(manifest.items.map((item) => item.id), ['item-a', 'item-b'])
  assert.deepEqual(manifest.collisions[0]?.itemIds, ['item-a', 'item-b'])
})

test('rejects invalid dates, timezones and content windows instead of guessing', () => {
  assert.throws(
    () =>
      compilePlaylist({
        playlist: basePlaylist,
        tenantId: 'tenant-a',
        siteId: 'site-stockholm',
        at: 'not-a-date',
      }),
    (error: unknown) => error instanceof SignageCompileError && error.code === 'INVALID_TIME',
  )

  for (const ambiguousInstant of ['2026-10-24 10:00:00', '24 October 2026', '2026-10-24T10:00:00Z']) {
    assert.throws(
      () =>
        compilePlaylist({
          playlist: basePlaylist,
          tenantId: 'tenant-a',
          siteId: 'site-stockholm',
          at: ambiguousInstant,
        }),
      (error: unknown) => error instanceof SignageCompileError && error.code === 'INVALID_TIME',
    )
  }

  assert.throws(
    () =>
      compilePlaylist({
        playlist: { ...basePlaylist, timezone: 'Invalid/Timezone' },
        tenantId: 'tenant-a',
        siteId: 'site-stockholm',
        at: '2026-10-24T10:00:00.000Z',
      }),
    (error: unknown) => error instanceof SignageCompileError && error.code === 'INVALID_TIMEZONE',
  )

  assert.throws(
    () =>
      compilePlaylist({
        playlist: {
          ...basePlaylist,
          items: [
            {
              ...basePlaylist.items[0]!,
              validFrom: '2026-10-25T10:00:00.000Z',
              validUntil: '2026-10-24T10:00:00.000Z',
            },
          ],
        },
        tenantId: 'tenant-a',
        siteId: 'site-stockholm',
        at: '2026-10-24T10:00:00.000Z',
      }),
    (error: unknown) => error instanceof SignageCompileError && error.code === 'INVALID_WINDOW',
  )
})

test('rejects identifiers that could collide in a hierarchical manifest key', () => {
  for (const invalidId of ['tenant/a', '../tenant-a', 'tenant a', 'tenant%2Fa']) {
    assert.throws(
      () =>
        compilePlaylist({
          playlist: { ...basePlaylist, tenantId: invalidId },
          tenantId: invalidId,
          siteId: 'site-stockholm',
          at: '2026-10-24T10:00:00.000Z',
        }),
      (error: unknown) =>
        error instanceof SignageCompileError && error.code === 'INVALID_PLAYLIST',
    )
  }
})

test('rejects unsafe, negative and non-canonical playback integers', () => {
  for (const invalidItem of [
    { priority: Number.MAX_SAFE_INTEGER + 1 },
    { position: -1 },
    { position: -0 },
  ]) {
    assert.throws(
      () =>
        compilePlaylist({
          playlist: {
            ...basePlaylist,
            items: [{ ...basePlaylist.items[0]!, ...invalidItem }],
          },
          tenantId: 'tenant-a',
          siteId: 'site-stockholm',
          at: '2026-10-24T10:00:00.000Z',
        }),
      (error: unknown) =>
        error instanceof SignageCompileError && error.code === 'INVALID_PLAYLIST',
    )
  }
})

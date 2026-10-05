// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { Users } from '@/src/collections/Users/Users'

describe('Users session revocation contract', () => {
  it('persists a backfill-compatible session_version in Payload JWTs', () => {
    const field = Users.fields.find(
      (candidate) => 'name' in candidate && candidate.name === 'session_version',
    ) as { defaultValue?: unknown; required?: boolean; saveToJWT?: boolean } | undefined

    expect(field).toMatchObject({
      defaultValue: 1,
      required: false,
      saveToJWT: true,
    })
  })
})

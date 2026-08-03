import { z } from 'zod'

import type { LearningSqlClient, NextLearningPrincipal } from './next-learning-transaction.ts'

const profileRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  email: z.email().max(254),
  name: z.string().min(1).max(240),
  role: z.string().min(1).max(64),
}).strict()

export type NextSessionProfile = {
  authenticated: true
  user: {
    id: number
    email: string
    name: string
    role: string
  }
}

export class NextSessionProfileError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextSessionProfileError'
    this.code = code
  }
}

export async function getNextSessionProfile({
  tx,
  principal,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
}): Promise<NextSessionProfile> {
  const rows = await tx.unsafe<Record<string, unknown>>(`
    SELECT id, email, name, role::text
    FROM users
    WHERE id = $1 AND tenant_id = $2 AND is_active = true
    LIMIT 1
  `, [principal.userId, principal.tenantId])
  const parsed = profileRowSchema.safeParse(rows[0])
  if (!parsed.success || parsed.data.id !== principal.userId || parsed.data.role !== principal.platformRole) {
    throw new NextSessionProfileError('next_session_profile_invalid')
  }
  return { authenticated: true, user: parsed.data }
}

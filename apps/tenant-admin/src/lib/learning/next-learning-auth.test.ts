import assert from 'node:assert/strict'
import test from 'node:test'

import { SignJWT } from 'jose'

import {
  authenticateNextLearningRequest,
  nextLearningSessionContract,
} from './next-learning-auth.ts'

const secret = 'next-auth-secret-that-is-long-enough-for-tests'

async function token(overrides: Record<string, unknown> = {}) {
  return new SignJWT({ tenantId: 7, type: 'akademate-next-session', ...overrides })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(nextLearningSessionContract.issuer)
    .setAudience(nextLearningSessionContract.audience)
    .setSubject('41')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(secret))
}

test('accepts only the dedicated Next session contract', async () => {
  const credential = await token()
  const request = new Request('http://localhost', {
    headers: { authorization: `Bearer ${credential}` },
  })
  assert.deepEqual(await authenticateNextLearningRequest(request, {
    AKADEMATE_RUNTIME: 'next',
    AKADEMATE_NEXT_AUTH_SECRET: secret,
  }), { userId: 41, tenantId: 7 })
})

test('rejects non-Next runtimes and missing or weak dedicated secrets', async () => {
  const credential = await token()
  const request = new Request('http://localhost', {
    headers: { authorization: `Bearer ${credential}` },
  })
  assert.equal(await authenticateNextLearningRequest(request, {
    AKADEMATE_RUNTIME: 'cep',
    AKADEMATE_NEXT_AUTH_SECRET: secret,
  }), null)
  assert.equal(await authenticateNextLearningRequest(request, {
    AKADEMATE_RUNTIME: 'next',
    AKADEMATE_NEXT_AUTH_SECRET: 'weak',
  }), null)
})

test('rejects legacy, wrong-audience and cross-runtime tokens', async () => {
  const legacy = await new SignJWT({ tenantId: 7, type: 'campus' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(nextLearningSessionContract.issuer)
    .setAudience(nextLearningSessionContract.audience)
    .setSubject('41')
    .sign(new TextEncoder().encode(secret))
  const wrongAudience = await new SignJWT({ tenantId: 7, type: 'akademate-next-session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(nextLearningSessionContract.issuer)
    .setAudience('cep')
    .setSubject('41')
    .sign(new TextEncoder().encode(secret))

  for (const credential of [legacy, wrongAudience]) {
    assert.equal(await authenticateNextLearningRequest(new Request('http://localhost', {
      headers: { cookie: `${nextLearningSessionContract.cookie}=${credential}; cep_session=ignored` },
    }), {
      AKADEMATE_RUNTIME: 'next',
      AKADEMATE_NEXT_AUTH_SECRET: secret,
    }), null)
  }
})

import { timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function equal(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Fixed, read-only technical smoke contract. It exposes no application data.
export async function GET(request: NextRequest) {
  const tokenFile = process.env.HEALTH_TECHNICAL_SMOKE_TOKEN_FILE
  const expectedPrincipal = process.env.HEALTH_TECHNICAL_SMOKE_PRINCIPAL
  if (!tokenFile || !expectedPrincipal) {
    return NextResponse.json({ status: 'not_configured' }, { status: 503 })
  }

  let expectedToken: string
  try {
    expectedToken = readFileSync(tokenFile, 'utf8').trim()
  } catch {
    return NextResponse.json({ status: 'not_configured' }, { status: 503 })
  }
  if (!expectedToken) return NextResponse.json({ status: 'not_configured' }, { status: 503 })

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const principal = request.headers.get('x-akademate-technical-principal') ?? ''
  if (!equal(token, expectedToken) || !equal(principal, expectedPrincipal)) {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ status: 'technical_ready', principal: expectedPrincipal })
}

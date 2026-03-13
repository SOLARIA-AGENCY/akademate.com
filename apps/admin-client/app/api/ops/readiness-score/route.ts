import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ReadinessCheck {
  name: string
  passed: boolean
  points: number
}

export async function GET() {
  const db = getDb()
  const checks: ReadinessCheck[] = []
  let score = 0

  // --- Check 1: Tenants activos > 0 (+20 pts) ---
  let tenantsTotal = 0
  let dbConnected = false

  try {
    const result = await db.query('SELECT COUNT(*) AS total FROM tenants WHERE active = true')
    tenantsTotal = parseInt(result.rows[0]?.total ?? '0', 10)
    dbConnected = true
  } catch {
    dbConnected = false
  }

  const hasActiveTenants = tenantsTotal > 0
  if (hasActiveTenants) score += 20
  checks.push({ name: 'Tenants activos > 0', passed: hasActiveTenants, points: 20 })

  // --- Check 2: Tenants con plan paid (limits_max_users > 5 = no plan free) (+20 pts) ---
  let paidTenants = 0
  if (dbConnected && tenantsTotal > 0) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) AS total FROM tenants WHERE active = true AND limits_max_users > 5',
      )
      paidTenants = parseInt(result.rows[0]?.total ?? '0', 10)
    } catch {
      // ignore
    }
  }

  const hasPaidTenants = paidTenants > 0
  if (hasPaidTenants) score += 20
  checks.push({ name: 'Tenants con plan paid (no trial)', passed: hasPaidTenants, points: 20 })

  // --- Check 3: DB conectada y respondiendo (+20 pts) ---
  if (dbConnected) score += 20
  checks.push({ name: 'DB conectada y respondiendo', passed: dbConnected, points: 20 })

  // --- Check 4: Payload API respondiendo (+20 pts) ---
  let payloadResponding = false
  try {
    const payloadUrl =
      process.env.PAYLOAD_CMS_URL?.trim() ||
      process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim() ||
      'http://localhost:3003'
    const res = await fetch(`${payloadUrl}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    payloadResponding = res.ok
  } catch {
    // not reachable
  }

  if (payloadResponding) score += 20
  checks.push({ name: 'Payload API respondiendo', passed: payloadResponding, points: 20 })

  // --- Check 5: BETTER_AUTH_SECRET configurado (+10 pts) ---
  const authSecret = process.env.BETTER_AUTH_SECRET ?? ''
  const placeholders = ['', 'your-secret', 'secret', 'change-me', 'changeme', 'placeholder']
  const authSecretValid =
    authSecret.length >= 16 && !placeholders.includes(authSecret.toLowerCase().trim())

  if (authSecretValid) score += 10
  checks.push({
    name: 'BETTER_AUTH_SECRET configurado y no es placeholder',
    passed: authSecretValid,
    points: 10,
  })

  // --- Check 6: DATABASE_URL configurado (+10 pts) ---
  const dbUrl = process.env.DATABASE_URL ?? ''
  const dbUrlConfigured = dbUrl.length > 0

  if (dbUrlConfigured) score += 10
  checks.push({ name: 'DATABASE_URL configurado', passed: dbUrlConfigured, points: 10 })

  return NextResponse.json({ score, maxScore: 100, checks })
}

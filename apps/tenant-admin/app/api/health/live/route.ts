import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Liveness must remain independent of the database and all external services.
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

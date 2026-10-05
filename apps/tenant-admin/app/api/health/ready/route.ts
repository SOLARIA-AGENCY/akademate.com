import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    const database = (payload as any).db?.drizzle || (payload as any).db?.pool

    if (typeof database?.execute === 'function') {
      await database.execute('SELECT 1')
    } else if (typeof database?.query === 'function') {
      await database.query('SELECT 1')
    } else {
      throw new Error('Database client is unavailable')
    }

    return NextResponse.json({ status: 'ready' })
  } catch {
    return NextResponse.json({ status: 'not_ready' }, { status: 503 })
  }
}

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Stub endpoint — returns empty array until API key management is implemented
export async function GET() {
  return NextResponse.json([])
}

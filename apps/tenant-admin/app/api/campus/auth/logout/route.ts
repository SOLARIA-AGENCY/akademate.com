import { NextRequest, NextResponse } from 'next/server'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import { clearCampusSessionCookie } from '@/src/lib/campus/auth'

export async function POST(_request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const response = NextResponse.json({ success: true })
  clearCampusSessionCookie(response)
  return response
}

import { NextRequest, NextResponse } from 'next/server'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import { readCampusSession } from '@/src/lib/campus/auth'

export async function GET(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const session = await readCampusSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesion no valida o expirada.' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    student: session.student,
    enrollments: session.enrollments,
  })
}

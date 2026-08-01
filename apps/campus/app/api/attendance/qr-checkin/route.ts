import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const unavailableBody = {
  success: false,
  status: 'pending' as const,
  code: 'ATTENDANCE_NOT_CONFIGURED',
  message:
    'El registro QR estara disponible cuando la academia active una integracion de asistencia validada.',
}

function attendanceNotConfigured() {
  return NextResponse.json(unavailableBody, {
    status: 503,
    headers: {
      'Cache-Control': 'private, no-store',
      'Retry-After': '3600',
    },
  })
}

/**
 * Fail-closed boundary.
 *
 * The previous shadow handler trusted student and enrollment identifiers from
 * the browser and inferred a class window from the QR timestamp. Akademate
 * Next must derive student, tenant, enrollment and the scheduled session from
 * authenticated server state before attendance writes are enabled.
 */
export function POST(_request: NextRequest) {
  return attendanceNotConfigured()
}

/** Instructor QR generation belongs to the authenticated staff API. */
export function GET(_request: NextRequest) {
  return attendanceNotConfigured()
}

/**
 * @fileoverview Student Attendance Page with QR Scanner
 * Allows students to check-in to sessions via QR code scan
 */

'use client'

import React, { useState, useCallback } from 'react'
import type { QRScanResult} from '../../components/attendance';
import { QRScanner, AttendanceStatusBadge, AttendanceSummaryCard } from '../../components/attendance'

// Mock data - would come from API
const mockEnrollmentId = 'enrollment-001'
const mockUserId = 'user-001'

interface CheckinResponse {
  success: boolean
  status: 'present' | 'late' | 'pending'
  message: string
  attendance?: {
    id: string
    checkInTime: string
    status: 'present' | 'late'
  }
}

interface RecentCheckin {
  id: string
  sessionTitle: string
  checkInTime: Date
  status: 'present' | 'late'
}

export default function AttendancePage() {
  const [scannerEnabled, setScannerEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastCheckin, setLastCheckin] = useState<CheckinResponse | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([])
  const [error, setError] = useState<string | null>(null)

  // Mock attendance summary
  const attendanceSummary = {
    totalSessions: 12,
    attended: 9,
    late: 2,
    excused: 0,
    absent: 1,
    attendanceRate: 91.7,
  }

  const handleScan = useCallback(async (result: QRScanResult) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/attendance/qr-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...result,
          userId: mockUserId,
          enrollmentId: mockEnrollmentId,
        }),
      })

      const data: CheckinResponse = await response.json()

      setLastCheckin(data)

      if (data.success && data.attendance) {
        // Add to recent checkins
        setRecentCheckins(prev => [
          {
            id: data.attendance!.id,
            sessionTitle: 'Sesion actual', // Would come from API
            checkInTime: new Date(data.attendance!.checkInTime),
            status: data.attendance!.status,
          },
          ...prev.slice(0, 4), // Keep last 5
        ])
        // Disable scanner after successful checkin
        setScannerEnabled(false)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error al registrar asistencia. Intenta de nuevo.')
      console.error('Checkin error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleScanError = useCallback((error: Error) => {
    console.error('Scanner error:', error)
    if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
      setError('Permiso de camara denegado. Por favor habilita el acceso a la camara.')
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asistencia</h1>
          <p className="text-sm text-muted-foreground">
            Escanea el codigo QR para registrar tu asistencia
          </p>
        </div>
        <AttendanceStatusBadge
          status={attendanceSummary.attendanceRate >= 75 ? 'present' : 'absent'}
        />
      </div>

      {/* Attendance Summary Card */}
      <AttendanceSummaryCard {...attendanceSummary} />

      {/* QR Scanner Section */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Registrar Asistencia</h2>
          <button
            onClick={() => setScannerEnabled(!scannerEnabled)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              scannerEnabled
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {scannerEnabled ? 'Cerrar Scanner' : 'Abrir Scanner'}
          </button>
        </div>

        {/* Scanner */}
        {scannerEnabled && (
          <div className="mb-4">
            <QRScanner
              onScan={handleScan}
              onError={handleScanError}
              enabled={scannerEnabled && !isLoading}
              className="mx-auto max-w-sm"
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Apunta la camara al codigo QR mostrado en la pantalla del instructor
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Registrando asistencia...</span>
          </div>
        )}

        {/* Success message */}
        {lastCheckin?.success && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-green-600">{lastCheckin.message}</p>
                {lastCheckin.attendance && (
                  <p className="text-sm text-muted-foreground">
                    Hora de registro:{' '}
                    {new Date(lastCheckin.attendance.checkInTime).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <AttendanceStatusBadge
                status={lastCheckin.status}
                className="ml-auto"
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠</span>
              <div>
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-sm text-destructive underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>

      {/* Recent Checkins */}
      {recentCheckins.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Registros Recientes</h2>
          <div className="space-y-3">
            {recentCheckins.map((checkin) => (
              <div
                key={checkin.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <div>
                  <p className="font-medium">{checkin.sessionTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {checkin.checkInTime.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    a las{' '}
                    {checkin.checkInTime.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <AttendanceStatusBadge status={checkin.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <h3 className="mb-2 font-semibold">Como registrar asistencia</h3>
        <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
          <li>Pulsa el boton "Abrir Scanner" arriba</li>
          <li>Permite el acceso a la camara cuando se solicite</li>
          <li>Apunta al codigo QR mostrado por tu instructor</li>
          <li>Espera la confirmacion del registro</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          <strong>Nota:</strong> El registro solo esta disponible 30 minutos antes y 60 minutos despues del inicio de la sesion.
          Llegadas con mas de 15 minutos de retraso se marcan como "Tarde".
        </p>
      </div>
    </div>
  )
}

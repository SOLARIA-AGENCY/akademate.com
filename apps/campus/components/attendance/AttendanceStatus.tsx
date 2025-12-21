/**
 * @fileoverview Attendance status display components
 */

'use client'

import React from 'react'

export type AttendanceStatusType = 'present' | 'absent' | 'late' | 'excused' | 'pending'

export interface AttendanceStatusProps {
  status: AttendanceStatusType
  checkInTime?: Date
  className?: string
}

const statusConfig: Record<AttendanceStatusType, { label: string; color: string; icon: string }> = {
  present: {
    label: 'Presente',
    color: 'bg-green-500/20 text-green-600 border-green-500/30',
    icon: '✓',
  },
  absent: {
    label: 'Ausente',
    color: 'bg-red-500/20 text-red-600 border-red-500/30',
    icon: '✗',
  },
  late: {
    label: 'Tarde',
    color: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    icon: '⏰',
  },
  excused: {
    label: 'Justificado',
    color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    icon: '📝',
  },
  pending: {
    label: 'Pendiente',
    color: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
    icon: '⋯',
  },
}

/**
 * Display attendance status badge
 */
export function AttendanceStatusBadge({ status, checkInTime, className }: AttendanceStatusProps) {
  const config = statusConfig[status]

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${config.color} ${className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {checkInTime && (
        <span className="ml-1 text-xs opacity-70">
          {checkInTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}

export interface AttendanceSummaryCardProps {
  totalSessions: number
  attended: number
  late: number
  excused: number
  absent: number
  attendanceRate: number
  className?: string
}

/**
 * Display attendance summary statistics
 */
export function AttendanceSummaryCard({
  totalSessions,
  attended,
  late,
  excused,
  absent,
  attendanceRate,
  className,
}: AttendanceSummaryCardProps) {
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Resumen de Asistencia
      </h3>

      {/* Attendance rate */}
      <div className="mb-4 flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${getAttendanceColor(attendanceRate)}`}>
          {attendanceRate.toFixed(1)}%
        </span>
        <span className="text-sm text-muted-foreground">tasa de asistencia</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${
            attendanceRate >= 90
              ? 'bg-green-500'
              : attendanceRate >= 75
                ? 'bg-amber-500'
                : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(attendanceRate, 100)}%` }}
        />
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <span className="text-lg">📚</span>
          <div>
            <div className="text-lg font-semibold">{totalSessions}</div>
            <div className="text-xs text-muted-foreground">Sesiones</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-2">
          <span className="text-lg">✓</span>
          <div>
            <div className="text-lg font-semibold text-green-600">{attended}</div>
            <div className="text-xs text-muted-foreground">Presente</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2">
          <span className="text-lg">⏰</span>
          <div>
            <div className="text-lg font-semibold text-amber-600">{late}</div>
            <div className="text-xs text-muted-foreground">Tarde</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2">
          <span className="text-lg">✗</span>
          <div>
            <div className="text-lg font-semibold text-red-600">{absent}</div>
            <div className="text-xs text-muted-foreground">Ausente</div>
          </div>
        </div>
      </div>

      {excused > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span>📝</span>
          <span>{excused} sesiones justificadas</span>
        </div>
      )}

      {/* Warning if below minimum */}
      {attendanceRate < 75 && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <strong>Aviso:</strong> Tu asistencia esta por debajo del 75% requerido para aprobar el curso.
        </div>
      )}
    </div>
  )
}

export default AttendanceStatusBadge

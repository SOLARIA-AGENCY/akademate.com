'use client'

/**
 * useDashboardMetrics Hook
 *
 * Combines initial API fetch with real-time Socket.io updates.
 * Falls back gracefully if Socket.io is not available.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSocketContextOptional } from '@akademate/realtime/context'
import { useMetrics } from '@akademate/realtime/hooks'
import type { ActivityPayload } from '@akademate/realtime'

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardMetrics {
  total_courses: number
  active_courses: number
  active_students: number
  total_students: number
  leads_this_month: number
  total_leads: number
  conversion_rate: number
  total_revenue: number
  active_convocations: number
  total_convocations: number
  total_teachers: number
  total_staff: number
  total_campuses: number
  classroom_utilization: number
}

export interface Convocation {
  id: number
  codigo: string
  course_title: string
  campus_name: string
  start_date: string
  end_date: string
  status: string
  enrolled: number
  capacity_max: number
}

export interface Campaign {
  id: number
  name: string
  leads_generated: number
  conversion_rate: number
  cost_per_lead: number
  status: string
}

export interface Activity {
  type: 'lead' | 'enrollment' | 'convocation'
  title: string
  entity_name: string
  timestamp: string
}

export interface Alert {
  severity: 'warning' | 'info'
  message: string
  count: number
}

export interface CampusDistribution {
  campus_name: string
  student_count: number
}

export interface WeeklyMetrics {
  leads: number[]
  enrollments: number[]
  courses_added: number[]
}

export interface DashboardData {
  metrics: DashboardMetrics
  convocations: Convocation[]
  campaigns: Campaign[]
  recentActivities: Activity[]
  weeklyMetrics: WeeklyMetrics
  alerts: Alert[]
  campusDistribution: CampusDistribution[]
}

// API response types
interface DashboardApiData {
  metrics?: DashboardMetrics
  upcoming_convocations?: Convocation[]
  campaigns?: Campaign[]
  recent_activities?: Activity[]
  weekly_metrics?: WeeklyMetrics
  alerts?: Alert[]
  campus_distribution?: CampusDistribution[]
}

interface DashboardApiResponse {
  success: boolean
  data?: DashboardApiData
  error?: string
}

const DEFAULT_METRICS: DashboardMetrics = {
  total_courses: 0,
  active_courses: 0,
  active_students: 0,
  total_students: 0,
  leads_this_month: 0,
  total_leads: 0,
  conversion_rate: 0,
  total_revenue: 0,
  active_convocations: 0,
  total_convocations: 0,
  total_teachers: 0,
  total_staff: 0,
  total_campuses: 0,
  classroom_utilization: 0,
}

// ============================================================================
// HOOK
// ============================================================================

export interface UseDashboardMetricsOptions {
  tenantId?: number
  enableRealtime?: boolean
}

export interface UseDashboardMetricsReturn {
  data: DashboardData
  loading: boolean
  error: string | null
  isConnected: boolean
  lastUpdate: Date | null
  refresh: () => Promise<void>
}

export function useDashboardMetrics(
  options: UseDashboardMetricsOptions = {}
): UseDashboardMetricsReturn {
  const { tenantId = 1, enableRealtime = true } = options

  // Local state for dashboard data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [realtimeActivities, setRealtimeActivities] = useState<Activity[]>([])
  const [data, setData] = useState<DashboardData>({
    metrics: DEFAULT_METRICS,
    convocations: [],
    campaigns: [],
    recentActivities: [],
    weeklyMetrics: { leads: [], enrollments: [], courses_added: [] },
    alerts: [],
    campusDistribution: [],
  })

  // Get socket context (optional - returns null if not in provider)
  const socketContext = useSocketContextOptional()
  const socket = socketContext?.socket ?? null
  const isConnected = socketContext?.isConnected ?? false

  // Real-time metrics subscription (only if socket is available)
  const { metrics: realtimeMetrics, lastUpdate: metricsLastUpdate } = useMetrics({
    socket: enableRealtime ? socket : null,
    tenantId,
  })

  // Listen for real-time activities
  useEffect(() => {
    if (!socket || !enableRealtime) return

    const handleActivity = (activity: ActivityPayload) => {
      if (activity.tenantId !== tenantId) return

      const mappedActivity: Activity = {
        type: activity.type.includes('lead') ? 'lead' :
              activity.type.includes('enrollment') ? 'enrollment' : 'convocation',
        title: activity.title,
        entity_name: activity.description ?? '',
        timestamp: activity.timestamp,
      }

      setRealtimeActivities((prev) => [mappedActivity, ...prev].slice(0, 10))
      setLastUpdate(new Date())
    }

    socket.on('activity:new', handleActivity)

    return () => {
      socket.off('activity:new', handleActivity)
    }
  }, [socket, tenantId, enableRealtime])

  // Fetch initial data from API
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Failed to load dashboard data')

      const result = (await response.json()) as DashboardApiResponse
      if (result.success && result.data) {
        setData({
          metrics: result.data.metrics ?? DEFAULT_METRICS,
          convocations: result.data.upcoming_convocations ?? [],
          campaigns: result.data.campaigns ?? [],
          recentActivities: result.data.recent_activities ?? [],
          weeklyMetrics: result.data.weekly_metrics ?? { leads: [], enrollments: [], courses_added: [] },
          alerts: result.data.alerts ?? [],
          campusDistribution: result.data.campus_distribution ?? [],
        })
        setLastUpdate(new Date())
        setError(null)
      } else {
        throw new Error(result.error ?? 'Error loading dashboard')
      }
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    void fetchDashboardData()
  }, [fetchDashboardData])

  // Apply real-time metrics updates
  useEffect(() => {
    if (realtimeMetrics && Object.keys(realtimeMetrics).length > 0) {
      setData((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          // Map realtime metrics format to dashboard format
          total_courses: realtimeMetrics.courses ?? prev.metrics.total_courses,
          active_students: realtimeMetrics.students ?? prev.metrics.active_students,
          leads_this_month: realtimeMetrics.leads ?? prev.metrics.leads_this_month,
          total_teachers: realtimeMetrics.teachers ?? prev.metrics.total_teachers,
          total_campuses: realtimeMetrics.campuses ?? prev.metrics.total_campuses,
          active_convocations: realtimeMetrics.convocations ?? prev.metrics.active_convocations,
        },
      }))
      if (metricsLastUpdate) {
        setLastUpdate(metricsLastUpdate)
      }
    }
  }, [realtimeMetrics, metricsLastUpdate])

  // Merge real-time activities with fetched activities
  useEffect(() => {
    if (realtimeActivities.length > 0) {
      setData((prev) => ({
        ...prev,
        recentActivities: [
          ...realtimeActivities,
          ...prev.recentActivities.filter(
            (a) => !realtimeActivities.some((ra) => ra.timestamp === a.timestamp)
          ),
        ].slice(0, 10),
      }))
    }
  }, [realtimeActivities])

  return {
    data,
    loading,
    error,
    isConnected,
    lastUpdate,
    refresh: fetchDashboardData,
  }
}

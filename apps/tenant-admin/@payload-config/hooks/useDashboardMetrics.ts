/**
 * Dashboard Metrics Hook
 *
 * Provides real-time dashboard metrics with optional SSE updates.
 */

import { useState, useEffect, useCallback } from 'react';

export interface Convocation {
  id: number;
  name: string;
  course_title: string;
  campus_name: string;
  status: string;
  start_date: string;
  end_date: string;
  enrolled: number;
  capacity_max: number;
  enrollmentsCount: number;
  capacityPercentage: number;
}

export interface Campaign {
  id: number;
  name: string;
  status: string;
  leads_generated: number;
  conversion_rate: number;
  cost_per_lead: number;
  leadsCount: number;
  conversionRate: number;
  budget: number;
  spent: number;
}

export interface DashboardMetrics {
  total_courses: number;
  active_students: number;
  leads_this_month: number;
  total_teachers: number;
  total_campuses: number;
  active_convocations: number;
}

export interface WeeklyMetrics {
  leads: number[];
  enrollments: number[];
  courses_added: number[];
}

export interface RecentActivity {
  id: number;
  title: string;
  entity_name: string;
  timestamp: string;
}

export interface OperationalAlert {
  severity: 'warning' | 'info';
  message: string;
  count: number;
}

export interface CampusDistribution {
  campus_name: string;
  student_count: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  convocations: Convocation[];
  campaigns: Campaign[];
  recentActivities: RecentActivity[];
  weeklyMetrics: WeeklyMetrics;
  alerts: OperationalAlert[];
  campusDistribution: CampusDistribution[];
}

interface UseDashboardMetricsOptions {
  tenantId?: number;
  enableRealtime?: boolean;
  refreshInterval?: number;
}

interface UseDashboardMetricsResult {
  data: DashboardData;
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
}

const defaultMetrics: DashboardData = {
  metrics: {
    total_courses: 0,
    active_students: 0,
    leads_this_month: 0,
    total_teachers: 0,
    total_campuses: 0,
    active_convocations: 0,
  },
  convocations: [],
  campaigns: [],
  recentActivities: [],
  weeklyMetrics: {
    leads: [],
    enrollments: [],
    courses_added: [],
  },
  alerts: [],
  campusDistribution: [],
};

interface RawDashboardResponse {
  metrics?: DashboardMetrics;
  upcoming_convocations?: Convocation[];
  convocations?: Convocation[];
  campaigns?: Campaign[];
  recent_activities?: RecentActivity[];
  recentActivities?: RecentActivity[];
  weekly_metrics?: WeeklyMetrics;
  weeklyMetrics?: WeeklyMetrics;
  alerts?: OperationalAlert[];
  campus_distribution?: CampusDistribution[];
  campusDistribution?: CampusDistribution[];
}

function normalizeDashboardData(raw: RawDashboardResponse): DashboardData {
  return {
    metrics: raw.metrics ?? defaultMetrics.metrics,
    convocations: raw.convocations ?? raw.upcoming_convocations ?? [],
    campaigns: raw.campaigns ?? [],
    recentActivities: raw.recentActivities ?? raw.recent_activities ?? [],
    weeklyMetrics: raw.weeklyMetrics ?? raw.weekly_metrics ?? defaultMetrics.weeklyMetrics,
    alerts: raw.alerts ?? [],
    campusDistribution: raw.campusDistribution ?? raw.campus_distribution ?? [],
  };
}

export function useDashboardMetrics(
  options: UseDashboardMetricsOptions = {}
): UseDashboardMetricsResult {
  const { tenantId = 1, enableRealtime = false, refreshInterval = 30000 } = options;

  const [data, setData] = useState<DashboardData>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/metrics?tenantId=${tenantId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }

      const result = await response.json();

      if (result.success) {
        setData(normalizeDashboardData(result.data as RawDashboardResponse));
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Real-time updates via SSE (optional)
  useEffect(() => {
    if (!enableRealtime) return;

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`/api/dashboard/stream?tenantId=${tenantId}`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          setData((prev) => ({ ...prev, ...update }));
          setLastUpdate(new Date());
        } catch (e) {
          console.error('Failed to parse SSE message:', e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
      };
    } catch (e) {
      console.error('Failed to connect to SSE:', e);
    }

    return () => {
      eventSource?.close();
      setIsConnected(false);
    };
  }, [tenantId, enableRealtime]);

  // Polling fallback when realtime is disabled
  useEffect(() => {
    if (enableRealtime) return;

    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [enableRealtime, refreshInterval, fetchMetrics]);

  return {
    data,
    loading,
    error,
    isConnected,
    lastUpdate,
    refresh: fetchMetrics,
  };
}

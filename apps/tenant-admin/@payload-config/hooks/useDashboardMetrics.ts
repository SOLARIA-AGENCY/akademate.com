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
  totalStudents: number;
  activeEnrollments: number;
  totalCourses: number;
  activeCourseRuns: number;
  pendingLeads: number;
  monthlyRevenue: number;
  completionRate: number;
  averageRating: number;
}

export interface WeeklyMetric {
  week: string;
  enrollments: number;
  leads: number;
  revenue: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  convocations: Convocation[];
  campaigns: Campaign[];
  recentActivities: RecentActivity[];
  weeklyMetrics: WeeklyMetric[];
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
    totalStudents: 0,
    activeEnrollments: 0,
    totalCourses: 0,
    activeCourseRuns: 0,
    pendingLeads: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    averageRating: 0,
  },
  convocations: [],
  campaigns: [],
  recentActivities: [],
  weeklyMetrics: [],
};

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
        setData(result.data);
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

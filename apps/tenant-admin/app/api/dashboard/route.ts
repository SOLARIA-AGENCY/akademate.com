import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { listCampaigns } from '../../../src/lib/meta-marketing';

interface RelatedEntity {
  id?: string | number;
  name?: string;
  title?: string;
}

interface CourseDoc {
  id: string | number;
  name?: string;
  title?: string;
  active?: boolean;
}

interface CourseRunDoc {
  id: string | number;
  codigo?: string;
  course?: RelatedEntity | string | number;
  campus?: RelatedEntity | string | number;
  instructor?: RelatedEntity | string | number | null;
  instructor_id?: string | number | null;
  start_date?: string;
  end_date?: string;
  status?: string;
  current_enrollments?: number;
  enrolled?: number;
  max_students?: number;
  capacity_max?: number;
  createdAt?: string;
}

interface CampusDoc {
  id: string | number;
  name?: string;
}

interface RecentActivity {
  type: string;
  title: string;
  entity_name: string;
  timestamp: string;
}

interface DashboardAlert {
  severity: 'info' | 'warning' | 'error';
  message: string;
  count: number;
}

interface CampusDistribution {
  campus_name: string;
  student_count: number;
}

interface UpcomingConvocation {
  id: string | number;
  codigo?: string;
  course_title: string;
  campus_name: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  enrolled: number;
  capacity_max: number;
}

interface DashboardCampaign {
  id: string | number;
  name: string;
  status: string;
  leads_generated: number;
  conversion_rate: number;
  cost_per_lead: number;
  budget: number;
  spent: number;
}

const SOLARIA_PREFIX = 'SOLARIA AGENCY';
const OPEN_CONVOCATION_STATUSES = new Set(['enrollment_open']);
const ACTIVE_CONVOCATION_STATUSES = new Set(['enrollment_open', 'published', 'in_progress']);

function asRows(result: unknown): any[] {
  if (Array.isArray(result)) return result;
  const typed = result as { rows?: any[] };
  return Array.isArray(typed?.rows) ? typed.rows : [];
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function hostLooksLikeCep(hostHeader?: string | null): boolean {
  const host = (hostHeader ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  const normalizedHost = host.replace(/:\d+$/, '');
  return /(^|\.)cepformacion(\.|$)/i.test(normalizedHost) || normalizedHost.includes('cep-formacion');
}

async function resolveTenantIdFromRequest(
  request: NextRequest,
  queryOne: (sql: string) => Promise<Record<string, unknown>>,
): Promise<number> {
  const rawTenantId = request.nextUrl.searchParams.get('tenantId');
  const explicitTenantId = Number.parseInt(rawTenantId ?? '', 10);
  if (Number.isInteger(explicitTenantId) && explicitTenantId > 0) return explicitTenantId;

  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const host = (hostHeader ?? '').split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') ?? '';

  if (host) {
    try {
      const row = await queryOne(`
        SELECT id
        FROM tenants
        WHERE LOWER(domain) = LOWER('${host.replace(/'/g, "''")}')
        LIMIT 1
      `);
      const hostTenantId = toNumber(row.id);
      if (hostTenantId > 0) return hostTenantId;
    } catch {
      // Continue with deterministic CEP/env fallback.
    }
  }

  if (hostLooksLikeCep(hostHeader)) return 1;

  const envTenantId = Number.parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? process.env.DEFAULT_TENANT_ID ?? '',
    10,
  );
  return Number.isInteger(envTenantId) && envTenantId > 0 ? envTenantId : 1;
}

function toDateKey(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

function getEntityName(entity: unknown, fallback: string): string {
  if (!entity || typeof entity !== 'object') return fallback;
  const row = entity as RelatedEntity;
  return row.name || row.title || fallback;
}

function getEntityId(entity: unknown): string | number | null {
  if (!entity) return null;
  if (typeof entity === 'string' || typeof entity === 'number') return entity;
  if (typeof entity === 'object') {
    const row = entity as RelatedEntity;
    return row.id ?? null;
  }
  return null;
}

function getStartOfWeekUTC(input: Date): Date {
  const d = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

function getLast4WeekKeys(now: Date = new Date()): string[] {
  const thisWeek = getStartOfWeekUTC(now);
  const keys: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const date = new Date(thisWeek);
    date.setUTCDate(thisWeek.getUTCDate() - i * 7);
    keys.push(date.toISOString().slice(0, 10));
  }
  return keys;
}

/**
 * GET /api/dashboard
 *
 * Retorna métricas agregadas para el dashboard principal.
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise });

    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool;
    const queryOne = async (sql: string): Promise<Record<string, unknown>> => {
      const res = await drizzle.execute(sql);
      const rows = asRows(res);
      return rows[0] ?? {};
    };
    const queryAll = async (sql: string): Promise<Record<string, unknown>[]> => {
      const res = await drizzle.execute(sql);
      return asRows(res);
    };

    const tenantId = await resolveTenantIdFromRequest(request, queryOne);
    const tenantWhere = { tenant: { equals: tenantId } };

    const safeFind = async (args: Record<string, unknown>) => {
      try {
        return await payload.find(args as any);
      } catch {
        return { docs: [], totalDocs: 0 };
      }
    };

    const [coursesData, convocationsData, campusesData, campaignsData] =
      await Promise.all([
        safeFind({
          collection: 'courses',
          where: tenantWhere,
          limit: 1000,
        }),
        safeFind({
          collection: 'course-runs',
          where: tenantWhere,
          limit: 1000,
          depth: 1,
        }),
        safeFind({
          collection: 'campuses',
          where: tenantWhere,
          limit: 200,
        }),
        safeFind({
          collection: 'campaigns',
          where: tenantWhere,
          sort: '-createdAt',
          limit: 200,
          depth: 0,
        }),
      ]);

    const courses = (coursesData.docs as CourseDoc[]) ?? [];
    const convocations = (convocationsData.docs as CourseRunDoc[]) ?? [];
    const campuses = (campusesData.docs as CampusDoc[]) ?? [];
    const localCampaignsRaw = (campaignsData.docs as any[]) ?? [];

    const totalCourses = toNumber(coursesData.totalDocs);
    const activeCourses = courses.filter((c) => c.active === true).length;

    const totalConvocations = toNumber(convocationsData.totalDocs);
    const activeConvocations = convocations.filter((cr) =>
      OPEN_CONVOCATION_STATUSES.has(String(cr.status ?? '').toLowerCase()),
    ).length;

    const totalCampuses = toNumber(campusesData.totalDocs);
    let totalStaff = 0;
    let totalTeachers = 0;

    const totalEnrolledByRuns = convocations.reduce(
      (sum, cr) => sum + toNumber(cr.current_enrollments ?? cr.enrolled),
      0,
    );
    const totalCapacity = convocations.reduce(
      (sum, cr) => sum + toNumber(cr.max_students ?? cr.capacity_max),
      0,
    );
    const classroomUtilization =
      totalCapacity > 0 ? Math.round((totalEnrolledByRuns / totalCapacity) * 100) : 0;

    let nonTestLeadFilter = '';
    try {
      const isTestColumn = await queryOne(`
        SELECT COUNT(*)::int AS cnt
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'leads'
          AND column_name = 'is_test'
      `);
      if (toNumber(isTestColumn.cnt) > 0) {
        nonTestLeadFilter = ' AND COALESCE(is_test, false) = false';
      }
    } catch {
      nonTestLeadFilter = '';
    }

    let totalLeads = 0;
    let leadsThisMonth = 0;
    let studentsWithEnrollment = 0;

    const weekKeys = getLast4WeekKeys();
    const weeklyLeadMap = new Map<string, number>();
    const weeklyEnrollmentMap = new Map<string, number>();
    const weeklyCourseMap = new Map<string, number>();
    for (const key of weekKeys) {
      weeklyLeadMap.set(key, 0);
      weeklyEnrollmentMap.set(key, 0);
      weeklyCourseMap.set(key, 0);
    }

    const recentActivities: RecentActivity[] = [];

    if (drizzle?.execute) {
      try {
        totalStaff = toNumber(
          (
            await queryOne(`
              SELECT COUNT(*)::int AS cnt
              FROM staff
              WHERE is_active = true
            `)
          ).cnt,
        );
      } catch {
        totalStaff = 0;
      }

      try {
        totalTeachers = toNumber(
          (
            await queryOne(`
              SELECT COUNT(*)::int AS cnt
              FROM staff
              WHERE is_active = true
                AND staff_type = 'profesor'
            `)
          ).cnt,
        );
      } catch {
        totalTeachers = 0;
      }

      totalLeads = toNumber(
        (await queryOne(`SELECT COUNT(*)::int AS cnt FROM leads WHERE tenant_id = ${tenantId}${nonTestLeadFilter}`)).cnt,
      );

      leadsThisMonth = toNumber(
        (
          await queryOne(`
            SELECT COUNT(*)::int AS cnt
            FROM leads
            WHERE tenant_id = ${tenantId}
              ${nonTestLeadFilter}
              AND created_at >= date_trunc('month', CURRENT_DATE)
          `)
        ).cnt,
      );

      try {
        const hasStudentsTenant = toNumber(
          (
            await queryOne(`
              SELECT COUNT(*)::int AS cnt
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'students'
                AND column_name = 'tenant_id'
            `)
          ).cnt,
        ) > 0;

        studentsWithEnrollment = hasStudentsTenant
          ? toNumber(
              (
                await queryOne(`
                  SELECT COUNT(*)::int AS cnt
                  FROM students
                  WHERE tenant_id = ${tenantId}
                    AND status = 'active'
                `)
              ).cnt,
            )
          : 0;
      } catch {
        studentsWithEnrollment = 0;
      }

      try {
        const leadWeekRows = await queryAll(`
          SELECT date_trunc('week', created_at)::date AS week, COUNT(*)::int AS cnt
          FROM leads
          WHERE tenant_id = ${tenantId}
            ${nonTestLeadFilter}
            AND created_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '21 days'
          GROUP BY 1
          ORDER BY 1
        `);
        for (const row of leadWeekRows) {
          const key = toDateKey(row.week);
          if (key && weeklyLeadMap.has(key)) {
            weeklyLeadMap.set(key, toNumber(row.cnt));
          }
        }
      } catch {
        // Keep zeroed weekly leads when table/schema mismatch.
      }

      try {
        const enrollmentWeekRows = await queryAll(`
          SELECT date_trunc('week', updated_at)::date AS week, COUNT(*)::int AS cnt
          FROM leads
          WHERE tenant_id = ${tenantId}
            ${nonTestLeadFilter}
            AND enrollment_id IS NOT NULL
            AND updated_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '21 days'
          GROUP BY 1
          ORDER BY 1
        `);
        for (const row of enrollmentWeekRows) {
          const key = toDateKey(row.week);
          if (key && weeklyEnrollmentMap.has(key)) {
            weeklyEnrollmentMap.set(key, toNumber(row.cnt));
          }
        }
      } catch {
        // Keep zeroed weekly enrollments when enrollment_id is unavailable.
      }

      try {
        const courseWeekRows = await queryAll(`
          SELECT date_trunc('week', created_at)::date AS week, COUNT(*)::int AS cnt
          FROM course_runs
          WHERE tenant_id = ${tenantId}
            AND created_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '21 days'
          GROUP BY 1
          ORDER BY 1
        `);
        for (const row of courseWeekRows) {
          const key = toDateKey(row.week);
          if (key && weeklyCourseMap.has(key)) {
            weeklyCourseMap.set(key, toNumber(row.cnt));
          }
        }
      } catch {
        // Keep zeroed weekly courses when course_runs tenant_id is unavailable.
      }

      try {
        const leadActivityRows = await queryAll(`
          SELECT first_name, last_name, email, created_at
          FROM leads
          WHERE tenant_id = ${tenantId}
            ${nonTestLeadFilter}
          ORDER BY created_at DESC
          LIMIT 3
        `);
        for (const row of leadActivityRows) {
          const fullName = `${String(row.first_name ?? '')} ${String(row.last_name ?? '')}`.trim();
          recentActivities.push({
            type: 'lead',
            title: 'Nuevo lead registrado',
            entity_name: fullName || String(row.email ?? 'Lead'),
            timestamp: String(row.created_at ?? new Date().toISOString()),
          });
        }
      } catch {
        // Lead activity is optional.
      }
    } else {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [totalLeadsRes, leadsThisMonthRes] = await Promise.all([
        safeFind({
          collection: 'leads',
          where: tenantWhere,
          limit: 1,
        }),
        safeFind({
          collection: 'leads',
          where: {
            and: [tenantWhere, { createdAt: { greater_than_equal: startOfMonth.toISOString() } }],
          },
          limit: 1,
        }),
      ]);

      totalLeads = toNumber(totalLeadsRes.totalDocs);
      leadsThisMonth = toNumber(leadsThisMonthRes.totalDocs);
      studentsWithEnrollment = 0;
    }

    const upcomingConvocations: UpcomingConvocation[] = convocations
      .filter((cr) => {
        if (!cr.start_date) return false;
        if (!ACTIVE_CONVOCATION_STATUSES.has(String(cr.status ?? '').toLowerCase())) return false;
        const startDate = new Date(cr.start_date);
        return !Number.isNaN(startDate.getTime()) && startDate > new Date();
      })
      .sort((a, b) => new Date(a.start_date ?? '').getTime() - new Date(b.start_date ?? '').getTime())
      .slice(0, 5)
      .map((cr) => ({
        id: cr.id,
        codigo: cr.codigo,
        course_title: getEntityName(cr.course, 'Curso'),
        campus_name: getEntityName(cr.campus, 'Sin sede'),
        start_date: cr.start_date,
        end_date: cr.end_date,
        status: cr.status,
        enrolled: toNumber(cr.current_enrollments ?? cr.enrolled),
        capacity_max: toNumber(cr.max_students ?? cr.capacity_max),
      }));

    recentActivities.push(
      ...convocations
        .filter((cr) => cr.createdAt)
        .slice(0, 3)
        .map((cr): RecentActivity => ({
          type: 'convocation',
          title: 'Nueva convocatoria creada',
          entity_name: getEntityName(cr.course, 'Curso'),
          timestamp: String(cr.createdAt),
        })),
    );

    const normalizedRecentActivities = recentActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    const alerts: DashboardAlert[] = [];

    const convocationsWithoutInstructor = convocations.filter((cr) => {
      const status = String(cr.status ?? '').toLowerCase();
      if (!ACTIVE_CONVOCATION_STATUSES.has(status)) return false;
      const instructorId = cr.instructor_id ?? getEntityId(cr.instructor);
      return !instructorId;
    });
    if (convocationsWithoutInstructor.length > 0) {
      alerts.push({
        severity: 'warning',
        message: 'Convocatorias sin profesor asignado',
        count: convocationsWithoutInstructor.length,
      });
    }

    const openWithoutStudents = convocations.filter(
      (cr) =>
        String(cr.status ?? '').toLowerCase() === 'enrollment_open' &&
        toNumber(cr.current_enrollments ?? cr.enrolled) === 0,
    );
    if (openWithoutStudents.length > 0) {
      alerts.push({
        severity: 'info',
        message: 'Convocatorias abiertas sin alumnos',
        count: openWithoutStudents.length,
      });
    }

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringSoon = convocations.filter((cr) => {
      if (String(cr.status ?? '').toLowerCase() !== 'enrollment_open') return false;
      if (!cr.start_date) return false;
      const startDate = new Date(cr.start_date);
      if (Number.isNaN(startDate.getTime())) return false;
      return startDate <= sevenDaysFromNow && startDate > new Date();
    });
    if (expiringSoon.length > 0) {
      alerts.push({
        severity: 'warning',
        message: 'Convocatorias que inician en menos de 7 días',
        count: expiringSoon.length,
      });
    }

    const campusDistribution: CampusDistribution[] = campuses
      .map((campus) => {
        const studentsInCampus = convocations
          .filter((cr) => String(getEntityId(cr.campus) ?? '') === String(campus.id))
          .reduce((sum, cr) => sum + toNumber(cr.current_enrollments ?? cr.enrolled), 0);
        return {
          campus_name: campus.name || 'Sede',
          student_count: studentsInCampus,
        };
      })
      .sort((a, b) => b.student_count - a.student_count);

    let dashboardCampaigns: DashboardCampaign[] = localCampaignsRaw
      .filter((c) => String(c?.name ?? '').toUpperCase().startsWith(SOLARIA_PREFIX))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: String(c.name ?? 'Campaña'),
        status: String(c.status ?? 'draft'),
        leads_generated: toNumber(c.total_leads),
        conversion_rate: toNumber(c.conversion_rate),
        cost_per_lead: toNumber(c.cost_per_lead),
        budget: toNumber(c.budget),
        spent: toNumber(c.budget),
      }));

    if (dashboardCampaigns.length === 0 && drizzle?.execute) {
      try {
        const tenantRow = await queryOne(`
          SELECT integrations_meta_ad_account_id, integrations_meta_marketing_api_token
          FROM tenants
          WHERE id = ${tenantId}
          LIMIT 1
        `);

        const metaAdAccountId = String(tenantRow.integrations_meta_ad_account_id ?? '').trim();
        const metaToken = String(tenantRow.integrations_meta_marketing_api_token ?? '').trim();

        if (metaAdAccountId && metaToken) {
          const metaResult = await listCampaigns(metaAdAccountId, metaToken);
          if (metaResult.success) {
            const metaRows = Array.isArray((metaResult.data as any)?.data)
              ? (metaResult.data as any).data
              : [];

            dashboardCampaigns = metaRows
              .filter((row: any) =>
                String(row?.name ?? '').toUpperCase().startsWith(SOLARIA_PREFIX),
              )
              .slice(0, 5)
              .map((row: any) => ({
                id: String(row?.id ?? ''),
                name: String(row?.name ?? 'Campaña Meta'),
                status:
                  String(row?.status ?? '').toUpperCase() === 'ACTIVE' ? 'active' : 'paused',
                leads_generated: 0,
                conversion_rate: 0,
                cost_per_lead: 0,
                budget: toNumber(row?.daily_budget) / 100,
                spent: toNumber(row?.daily_budget) / 100,
              }));
          }
        }
      } catch {
        // Meta fallback is best-effort.
      }
    }

    const activeStudents = studentsWithEnrollment;
    const conversionRate =
      totalLeads > 0 ? Math.round((studentsWithEnrollment / totalLeads) * 1000) / 10 : 0;

    const metrics = {
      total_courses: totalCourses,
      active_courses: activeCourses,
      active_students: activeStudents,
      total_students: activeStudents,
      leads_this_month: leadsThisMonth,
      total_leads: totalLeads,
      conversion_rate: conversionRate,
      total_revenue: 0,
      active_convocations: activeConvocations,
      total_convocations: totalConvocations,
      total_teachers: totalTeachers,
      total_staff: totalStaff,
      total_campuses: totalCampuses,
      classroom_utilization: classroomUtilization,
    };

    const weeklyMetrics = {
      leads: weekKeys.map((key) => weeklyLeadMap.get(key) ?? 0),
      enrollments: weekKeys.map((key) => weeklyEnrollmentMap.get(key) ?? 0),
      courses_added: weekKeys.map((key) => weeklyCourseMap.get(key) ?? 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        upcoming_convocations: upcomingConvocations,
        campaigns: dashboardCampaigns,
        recent_activities: normalizedRecentActivities,
        weekly_metrics: weeklyMetrics,
        alerts: alerts.slice(0, 3),
        campus_distribution: campusDistribution,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching dashboard metrics:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error al obtener métricas del dashboard';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

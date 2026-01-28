import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';

// ============================================================================
// Dashboard API Types
// ============================================================================

/** Related entity reference (can be populated object or just ID) */
interface RelatedEntity {
  id: string;
  name?: string;
}

/** Course document from Payload CMS */
interface CourseDoc {
  id: string;
  name?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Course Run (Convocation) document from Payload CMS */
interface CourseRunDoc {
  id: string;
  codigo?: string;
  course?: RelatedEntity | string;
  campus?: RelatedEntity | string;
  instructor_id?: string | null;
  start_date?: string;
  end_date?: string;
  status?: 'abierta' | 'planificada' | 'cerrada' | 'finalizada';
  enrolled?: number;
  capacity_max?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Campus document from Payload CMS */
interface CampusDoc {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Staff count API response */
interface StaffCountResponse {
  total?: number;
  docs?: unknown[];
}

/** Recent activity item for dashboard */
interface RecentActivity {
  type: string;
  title: string;
  entity_name: string;
  timestamp: string;
}

/** Operational alert for dashboard */
interface DashboardAlert {
  severity: 'info' | 'warning' | 'error';
  message: string;
  count: number;
}

/** Campus distribution item */
interface CampusDistribution {
  campus_name: string;
  student_count: number;
}

/** Upcoming convocation summary */
interface UpcomingConvocation {
  id: string;
  codigo?: string;
  course_title: string;
  campus_name: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  enrolled: number;
  capacity_max: number;
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * GET /api/dashboard
 *
 * Retorna métricas agregadas para el dashboard principal
 */
export async function GET(_request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = await getPayloadHMR({ config: configPromise });

    // Fetch all data in parallel (excluding staff to avoid schema issues)
    const [
      coursesData,
      convocationsData,
      campusesData,
    ] = await Promise.all([
      // Cursos
      payload.find({
        collection: 'courses',
        limit: 1000,
      }),
      // Convocatorias (Course Runs)
      payload.find({
        collection: 'course-runs',
        limit: 1000,
      }),
      // Sedes (Campuses)
      payload.find({
        collection: 'campuses',
        limit: 100,
      }),
    ]);

    // Fetch staff count using simpler approach (avoiding complex joins)
    let totalStaff = 0;
    let totalTeachers = 0;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3002';
      const staffCountResponse = await fetch(`${baseUrl}/api/staff?limit=1`);
      if (staffCountResponse.ok) {
        const staffCountData = (await staffCountResponse.json()) as StaffCountResponse;
        totalStaff = staffCountData.total ?? 0;
      }
      const teachersCountResponse = await fetch(`${baseUrl}/api/staff?type=profesor&limit=1`);
      if (teachersCountResponse.ok) {
        const teachersCountData = (await teachersCountResponse.json()) as StaffCountResponse;
        totalTeachers = teachersCountData.total ?? 0;
      }
    } catch (err: unknown) {
      console.error('Error fetching staff counts:', err);
    }

    // Calculate metrics
    const totalCourses = coursesData.totalDocs;
    const courses = coursesData.docs as CourseDoc[];
    const activeCourses = courses.filter((c) => c.active === true).length;

    const totalConvocations = convocationsData.totalDocs;
    const convocations = convocationsData.docs as CourseRunDoc[];
    const activeConvocations = convocations.filter(
      (cr) => cr.status === 'abierta' || cr.status === 'planificada'
    ).length;

    const totalCampuses = campusesData.totalDocs;
    const campuses = campusesData.docs as CampusDoc[];

    // Calculate enrollments from convocations
    const totalEnrolled = convocations.reduce(
      (sum, cr) => sum + (cr.enrolled ?? 0),
      0
    );

    // Calculate capacity utilization
    const totalCapacity = convocations.reduce(
      (sum, cr) => sum + (cr.capacity_max ?? 0),
      0
    );
    const classroomUtilization = totalCapacity > 0
      ? Math.round((totalEnrolled / totalCapacity) * 100)
      : 0;

    // Mock data for leads and revenue (TODO: implement when leads collection exists)
    const leadsThisMonth = 0;
    const totalLeads = 0;
    const conversionRate = 0;
    const totalRevenue = 0;

    // Get upcoming convocations
    const now = new Date();
    const upcomingConvocations: UpcomingConvocation[] = convocations
      .filter((cr) => {
        if (!cr.start_date) return false;
        const startDate = new Date(cr.start_date);
        return startDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.start_date!).getTime();
        const dateB = new Date(b.start_date!).getTime();
        return dateA - dateB;
      })
      .slice(0, 5)
      .map((cr) => {
        const courseRef = cr.course;
        const campusRef = cr.campus;
        return {
          id: cr.id,
          codigo: cr.codigo,
          course_title: typeof courseRef === 'object' && courseRef?.name ? courseRef.name : 'Sin nombre',
          campus_name: typeof campusRef === 'object' && campusRef?.name ? campusRef.name : 'Sin sede',
          start_date: cr.start_date,
          end_date: cr.end_date,
          status: cr.status,
          enrolled: cr.enrolled ?? 0,
          capacity_max: cr.capacity_max ?? 0,
        };
      });

    const metrics = {
      // Courses
      total_courses: totalCourses,
      active_courses: activeCourses,

      // Students
      active_students: totalEnrolled,
      total_students: totalEnrolled,

      // Leads (mock - implement later)
      leads_this_month: leadsThisMonth,
      total_leads: totalLeads,
      conversion_rate: conversionRate,

      // Revenue (mock - implement later)
      total_revenue: totalRevenue,

      // Convocations
      active_convocations: activeConvocations,
      total_convocations: totalConvocations,

      // Staff
      total_teachers: totalTeachers,
      total_staff: totalStaff,

      // Campuses
      total_campuses: totalCampuses,

      // Utilization
      classroom_utilization: classroomUtilization,
    };

    // Recent Activity (last 5 events)
    const recentActivities: RecentActivity[] = [
      ...convocations
        .filter((cr) => cr.createdAt)
        .slice(0, 3)
        .map((cr): RecentActivity => {
          const courseRef = cr.course;
          return {
            type: 'convocation',
            title: 'Nueva convocatoria publicada',
            entity_name: typeof courseRef === 'object' && courseRef?.name ? courseRef.name : 'Curso',
            timestamp: cr.createdAt!,
          };
        }),
      // Mock lead/enrollment events (implement when collections exist)
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    // Weekly Metrics (last 4 weeks) - Mock data for now
    const weeklyMetrics = {
      leads: [12, 18, 15, 22],
      enrollments: [5, 8, 6, 10],
      courses_added: [1, 0, 2, 1],
    };

    // Operational Alerts
    const alerts: DashboardAlert[] = [];

    // Alert 1: Convocations without instructor
    const convocationsWithoutInstructor = convocations.filter(
      (cr) => (cr.status === 'abierta' || cr.status === 'planificada') && !cr.instructor_id
    );
    if (convocationsWithoutInstructor.length > 0) {
      alerts.push({
        severity: 'warning',
        message: 'Convocatorias sin profesor asignado',
        count: convocationsWithoutInstructor.length,
      });
    }

    // Alert 2: Active courses with 0 enrollments
    const coursesWithoutStudents = convocations.filter(
      (cr) => (cr.status === 'abierta') && (cr.enrolled ?? 0) === 0
    );
    if (coursesWithoutStudents.length > 0) {
      alerts.push({
        severity: 'info',
        message: 'Convocatorias abiertas sin alumnos',
        count: coursesWithoutStudents.length,
      });
    }

    // Alert 3: Convocations expiring soon (<7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringConvocations = convocations.filter((cr) => {
      if (!cr.start_date || cr.status !== 'abierta') return false;
      const startDate = new Date(cr.start_date);
      return startDate <= sevenDaysFromNow && startDate > now;
    });
    if (expiringConvocations.length > 0) {
      alerts.push({
        severity: 'warning',
        message: 'Convocatorias que inician en menos de 7 días',
        count: expiringConvocations.length,
      });
    }

    // Campus Distribution
    const campusDistribution: CampusDistribution[] = campuses.map((campus) => {
      const studentsInCampus = convocations
        .filter((cr) => {
          const campusRef = cr.campus;
          const campusId = typeof campusRef === 'object' ? campusRef?.id : campusRef;
          return campusId === campus.id;
        })
        .reduce((sum, cr) => sum + (cr.enrolled ?? 0), 0);

      return {
        campus_name: campus.name,
        student_count: studentsInCampus,
      };
    }).sort((a, b) => b.student_count - a.student_count);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        upcoming_convocations: upcomingConvocations,
        campaigns: [], // TODO: implement when campaigns collection exists
        recent_activities: recentActivities,
        weekly_metrics: weeklyMetrics,
        alerts: alerts.slice(0, 3), // Max 3 alerts
        campus_distribution: campusDistribution,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching dashboard metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener métricas del dashboard';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

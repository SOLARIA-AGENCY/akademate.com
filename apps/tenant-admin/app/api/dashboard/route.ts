import { NextRequest, NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';

/**
 * GET /api/dashboard
 *
 * Retorna métricas agregadas para el dashboard principal
 */
export async function GET(request: NextRequest) {
  try {
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
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3002';
      const staffCountResponse = await fetch(`${baseUrl}/api/staff?limit=1`);
      if (staffCountResponse.ok) {
        const staffCountData = await staffCountResponse.json();
        totalStaff = staffCountData.total || 0;
      }
      const teachersCountResponse = await fetch(`${baseUrl}/api/staff?type=profesor&limit=1`);
      if (teachersCountResponse.ok) {
        const teachersCountData = await teachersCountResponse.json();
        totalTeachers = teachersCountData.total || 0;
      }
    } catch (err) {
      console.error('Error fetching staff counts:', err);
    }

    // Calculate metrics
    const totalCourses = coursesData.totalDocs;
    const activeCourses = coursesData.docs.filter((c: any) => c.active === true).length;

    const totalConvocations = convocationsData.totalDocs;
    const activeConvocations = convocationsData.docs.filter(
      (cr: any) => cr.status === 'abierta' || cr.status === 'planificada'
    ).length;

    const totalCampuses = campusesData.totalDocs;

    // Calculate enrollments from convocations
    const totalEnrolled = convocationsData.docs.reduce(
      (sum: number, cr: any) => sum + (cr.enrolled || 0),
      0
    );

    // Calculate capacity utilization
    const totalCapacity = convocationsData.docs.reduce(
      (sum: number, cr: any) => sum + (cr.capacity_max || 0),
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
    const upcomingConvocations = convocationsData.docs
      .filter((cr: any) => {
        if (!cr.start_date) return false;
        const startDate = new Date(cr.start_date);
        return startDate > now;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return dateA - dateB;
      })
      .slice(0, 5)
      .map((cr: any) => ({
        id: cr.id,
        codigo: cr.codigo,
        course_title: typeof cr.course === 'object' ? cr.course?.name : 'Sin nombre',
        campus_name: typeof cr.campus === 'object' ? cr.campus?.name : 'Sin sede',
        start_date: cr.start_date,
        end_date: cr.end_date,
        status: cr.status,
        enrolled: cr.enrolled || 0,
        capacity_max: cr.capacity_max || 0,
      }));

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
    const recentActivities = [
      ...convocationsData.docs
        .filter((cr: any) => cr.createdAt)
        .slice(0, 3)
        .map((cr: any) => ({
          type: 'convocation',
          title: 'Nueva convocatoria publicada',
          entity_name: typeof cr.course === 'object' ? cr.course?.name : 'Curso',
          timestamp: cr.createdAt,
        })),
      // Mock lead/enrollment events (implement when collections exist)
    ]
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    // Weekly Metrics (last 4 weeks) - Mock data for now
    const weeklyMetrics = {
      leads: [12, 18, 15, 22],
      enrollments: [5, 8, 6, 10],
      courses_added: [1, 0, 2, 1],
    };

    // Operational Alerts
    const alerts = [];

    // Alert 1: Convocations without instructor
    const convocationsWithoutInstructor = convocationsData.docs.filter(
      (cr: any) => (cr.status === 'abierta' || cr.status === 'planificada') && !cr.instructor_id
    );
    if (convocationsWithoutInstructor.length > 0) {
      alerts.push({
        severity: 'warning',
        message: 'Convocatorias sin profesor asignado',
        count: convocationsWithoutInstructor.length,
      });
    }

    // Alert 2: Active courses with 0 enrollments
    const coursesWithoutStudents = convocationsData.docs.filter(
      (cr: any) => (cr.status === 'abierta') && (cr.enrolled || 0) === 0
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
    const expiringConvocations = convocationsData.docs.filter((cr: any) => {
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
    const campusDistribution = campusesData.docs.map((campus: any) => {
      const studentsInCampus = convocationsData.docs
        .filter((cr: any) => {
          const campusId = typeof cr.campus === 'object' ? cr.campus?.id : cr.campus;
          return campusId === campus.id;
        })
        .reduce((sum: number, cr: any) => sum + (cr.enrolled || 0), 0);

      return {
        campus_name: campus.name,
        student_count: studentsInCampus,
      };
    }).sort((a: any, b: any) => b.student_count - a.student_count);

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
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener métricas del dashboard',
      },
      { status: 500 }
    );
  }
}

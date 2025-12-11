import { NextRequest, NextResponse } from 'next/server';
/**
 * GET /api/dashboard
 *
 * Retorna métricas agregadas para el dashboard principal
 */
export declare function GET(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        metrics: {
            total_courses: number;
            active_courses: number;
            active_students: number;
            total_students: number;
            leads_this_month: number;
            total_leads: number;
            conversion_rate: number;
            total_revenue: number;
            active_convocations: number;
            total_convocations: number;
            total_teachers: number;
            total_staff: number;
            total_campuses: number;
            classroom_utilization: number;
        };
        upcoming_convocations: {
            id: any;
            codigo: any;
            course_title: any;
            campus_name: any;
            start_date: any;
            end_date: any;
            status: any;
            enrolled: any;
            capacity_max: any;
        }[];
        campaigns: never[];
        recent_activities: {
            type: string;
            title: string;
            entity_name: any;
            timestamp: any;
        }[];
        weekly_metrics: {
            leads: number[];
            enrollments: number[];
            courses_added: number[];
        };
        alerts: {
            severity: string;
            message: string;
            count: number;
        }[];
        campus_distribution: {
            campus_name: any;
            student_count: number;
        }[];
    };
}> | NextResponse<{
    success: boolean;
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map
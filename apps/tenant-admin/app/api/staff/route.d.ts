import { NextRequest, NextResponse } from 'next/server';
/**
 * GET /api/staff?type=instructor|administrative&campus=X&status=active
 *
 * Lista miembros del personal con filtros opcionales (SQL directo)
 */
export declare function GET(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        id: any;
        staffType: any;
        firstName: any;
        lastName: any;
        fullName: any;
        email: any;
        phone: any;
        position: any;
        contractType: any;
        employmentStatus: any;
        hireDate: any;
        photo: string;
        bio: any;
        assignedCampuses: any;
        courseRuns: any;
        courseRunsCount: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }[];
    total: number;
}> | NextResponse<{
    success: boolean;
    error: any;
}>>;
/**
 * POST /api/staff
 *
 * Crea un nuevo miembro del personal
 */
export declare function POST(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        id: number;
        fullName: string | null | undefined;
    };
    message: string;
}> | NextResponse<{
    success: boolean;
    error: any;
}>>;
/**
 * PUT /api/staff/:id
 *
 * Actualiza un miembro del personal
 */
export declare function PUT(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        id: number;
        fullName: string | null | undefined;
    };
    message: string;
}> | NextResponse<{
    success: boolean;
    error: any;
}>>;
/**
 * DELETE /api/staff/:id
 *
 * Elimina (desactiva) un miembro del personal
 * Nota: No se elimina físicamente, solo se marca como inactivo
 */
export declare function DELETE(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    message: string;
}> | NextResponse<{
    success: boolean;
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map
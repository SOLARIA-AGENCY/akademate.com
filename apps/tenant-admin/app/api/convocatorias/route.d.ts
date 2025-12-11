import { NextRequest, NextResponse } from 'next/server';
/**
 * POST /api/convocatorias
 *
 * Crea una nueva convocatoria para un curso
 */
export declare function POST(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        id: any;
        courseId: number;
        courseName: string;
    };
    message: string;
}> | NextResponse<{
    success: boolean;
    error: any;
}>>;
/**
 * GET /api/convocatorias?courseId=X&campusId=Y
 *
 * Lista convocatorias de un curso o de un campus (o ambos)
 */
export declare function GET(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    error: string;
}> | NextResponse<{
    success: boolean;
    data: {
        id: any;
        cursoId: any;
        cursoNombre: any;
        cursoTipo: any;
        campusId: any;
        campusNombre: any;
        fechaInicio: any;
        fechaFin: any;
        horario: string;
        estado: any;
        plazasTotales: any;
        plazasOcupadas: any;
        precio: any;
        profesor: any;
        modalidad: any;
    }[];
    total: number;
}>>;
//# sourceMappingURL=route.d.ts.map
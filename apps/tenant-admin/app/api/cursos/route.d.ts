import { NextRequest, NextResponse } from 'next/server';
/**
 * POST /api/cursos
 *
 * Crea un nuevo curso con código auto-generado
 * Body: { nombre, area_formativa_id, tipo, descripcion, ... }
 */
export declare function POST(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        id: number;
        codigo: string;
        nombre: string;
    };
    message: string;
}> | NextResponse<{
    success: boolean;
    error: any;
}>>;
/**
 * GET /api/cursos
 *
 * Lista cursos (opcional, para debugging)
 * OPTIMIZADO: Cache de 10 segundos para reducir hits a Payload
 */
export declare function GET(): Promise<NextResponse<{
    success: boolean;
    data: {
        id: any;
        codigo: any;
        nombre: any;
        tipo: any;
        descripcion: any;
        area: any;
        duracionReferencia: any;
        precioReferencia: any;
        porcentajeSubvencion: any;
        imagenPortada: string;
        totalConvocatorias: number;
    }[];
    total: number;
}> | NextResponse<{
    success: boolean;
    error: string;
}>>;
//# sourceMappingURL=route.d.ts.map
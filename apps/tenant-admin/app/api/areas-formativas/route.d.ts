import { NextRequest, NextResponse } from 'next/server';
/**
 * GET /api/areas-formativas
 *
 * Retorna todas las áreas formativas activas
 * Usado por frontend para dropdown en formulario de creación de cursos
 * OPTIMIZADO: Cache de 60 segundos (datos maestros que cambian poco)
 */
export declare function GET(): Promise<NextResponse<{
    success: boolean;
    data: {
        id: number;
        nombre: string;
        codigo: string;
        color: string | null | undefined;
    }[];
}> | NextResponse<{
    success: boolean;
    error: string;
}>>;
/**
 * POST /api/areas-formativas
 *
 * Crea una nueva área formativa
 * Body: { nombre, codigo, descripcion?, color?, activo? }
 */
export declare function POST(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        id: number;
        nombre: string;
        codigo: string;
        color: string | null | undefined;
        activo: boolean | null | undefined;
    };
    message: string;
}> | NextResponse<{
    success: boolean;
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map
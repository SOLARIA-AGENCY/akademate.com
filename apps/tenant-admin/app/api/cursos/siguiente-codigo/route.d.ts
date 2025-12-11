import { NextRequest, NextResponse } from 'next/server';
/**
 * GET /api/cursos/siguiente-codigo?areaId=xxx&tipo=privados
 *
 * Genera el siguiente código secuencial para un curso
 * Formato: {AREA_CODE}-{TIPO_CODE}-{SECUENCIAL}
 */
export declare function GET(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    error: string;
}> | NextResponse<{
    success: boolean;
    data: {
        codigo: string;
        area_codigo: string;
        tipo_codigo: string;
        secuencial: string;
    };
}>>;
//# sourceMappingURL=route.d.ts.map
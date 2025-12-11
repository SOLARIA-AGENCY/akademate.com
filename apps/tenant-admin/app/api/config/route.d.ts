import { NextRequest, NextResponse } from 'next/server';
export declare function GET(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    error: string;
}> | NextResponse<{
    success: boolean;
    data: {
        principal: string;
        oscuro: string;
        claro: string;
        favicon: string;
    };
}> | NextResponse<{
    success: boolean;
    data: {
        nombre: string;
    };
}> | NextResponse<{
    success: boolean;
    data: {
        colorPrimario: string;
        colorSecundario: string;
        colorAcento: string;
        fuentePrincipal: string;
        tema: string;
    };
}>>;
export declare function PUT(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    message: string;
    data: any;
}> | NextResponse<{
    success: boolean;
    error: string;
}>>;
//# sourceMappingURL=route.d.ts.map
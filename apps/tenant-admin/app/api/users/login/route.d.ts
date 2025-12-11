import { NextResponse } from 'next/server';
/**
 * Custom Login API Route
 * Workaround for Payload CMS 3.x body parsing issue in Next.js 15 App Router
 *
 * POST /api/users/login
 * Body: { email: string, password: string }
 * Returns: { user, token, exp } on success
 */
export declare function POST(request: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    message: string;
    user: {
        id: number;
        email: string;
        name: string;
        role: "admin" | "gestor" | "marketing" | "asesor" | "lectura" | "superadmin";
    };
    token: string;
    exp: number | undefined;
}>>;
export declare function OPTIONS(): Promise<NextResponse<{}>>;
//# sourceMappingURL=route.d.ts.map
/**
 * LMS Content API Routes
 * 
 * Exposes content delivery functionality from @akademate/lms
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import type { Payload } from 'payload';
import configPromise from '@payload-config';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/lms/content?courseId=X&moduleId=Y
 * 
 * Get modules for a course or lessons for a module
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const moduleId = searchParams.get('moduleId');

         
        const payload: Payload = await getPayloadHMR({ config: configPromise });

        if (courseId) {
            // Get modules for a course
            const modules = await payload.find({
                collection: 'modules' as 'users',
                where: { course: { equals: courseId } },
                sort: 'order',
                depth: 1,
            });

            return NextResponse.json({
                success: true,
                data: {
                    courseId,
                    modules: modules.docs,
                    totalModules: modules.totalDocs,
                },
            });
        }

        if (moduleId) {
            // Get lessons for a module
            const lessons = await payload.find({
                collection: 'lessons' as 'users',
                where: { module: { equals: moduleId } },
                sort: 'order',
                depth: 1,
            });

            // Get materials for the module
            const materials = await payload.find({
                collection: 'materials' as 'users',
                where: { module: { equals: moduleId } },
                depth: 1,
            });

            return NextResponse.json({
                success: true,
                data: {
                    moduleId,
                    lessons: lessons.docs,
                    totalLessons: lessons.totalDocs,
                    materials: materials.docs,
                    totalMaterials: materials.totalDocs,
                },
            });
        }

        return NextResponse.json(
            { success: false, error: 'courseId or moduleId is required' },
            { status: 400 }
        );
    } catch (error) {
        console.error('[LMS Content] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch content';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

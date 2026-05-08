import { getPayload } from 'payload'
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Payload } from 'payload';
import { getPublicStudyTypeFallbackImage, normalizeStudyType } from '@/app/lib/website/study-types';
import { withTenantScope } from '@/app/lib/server/tenant-scope';
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth';

interface AreaFormativa {
  id: number;
  codigo: string;
  nombre: string;
}

interface FeaturedImage {
  id: number;
  filename: string;
  url?: string;
}

interface CourseDocument {
  id: number;
  codigo: string;
  name: string;
  course_type: string;
  short_description?: string;
  duration_hours?: number;
  base_price?: number;
  subsidy_percentage?: number;
  area_formativa?: AreaFormativa | number;
  featured_image?: FeaturedImage | number;
  dossier_pdf?: FeaturedImage | number;
  landing_enabled?: boolean | null;
  landing_target_audience?: string | null;
  landing_access_requirements?: string | null;
  landing_outcomes?: string | null;
  landing_objectives?: Array<{ text?: string | null }> | null;
  landing_program_blocks?: Array<{
    title?: string | null;
    body?: string | null;
    items?: Array<{ text?: string | null }> | null;
  }> | null;
  landing_faqs?: Array<{ question?: string | null; answer?: string | null }> | null;
  active?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

function resolveFeaturedImageUrl(image: CourseDocument['featured_image']): string | null {
  if (!image || typeof image === 'number') return null;
  if (image.url) return image.url;
  if (image.filename) return `/api/media/file/${image.filename}`;
  return null;
}

function toTextArray(items: CourseDocument['landing_objectives']): string[] {
  return (items ?? []).map((item) => String(item?.text ?? '').trim()).filter(Boolean);
}

/**
 * GET /api/cursos/[id]
 *
 * Retorna un curso por su ID numérico de Payload
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const payload: Payload = await getPayload({ config: configPromise });
    const authContext = await getAuthenticatedUserContext(request, payload as any);
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await payload.find({
      collection: 'courses',
      where: withTenantScope({ id: { equals: numericId } }, authContext.tenantId) as any,
      limit: 1,
      depth: 2,
    });
    const curso = (result.docs[0] ?? null) as unknown as CourseDocument | null;

    if (!curso) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Extraer nombre del área formativa
    const areaFormativa = curso.area_formativa;
    let areaName = 'Sin área';
    if (typeof areaFormativa === 'object' && areaFormativa !== null) {
      areaName = areaFormativa.nombre ?? 'Sin área';
    }

    const imagenPortada =
      resolveFeaturedImageUrl(curso.featured_image) ?? getPublicStudyTypeFallbackImage(curso.course_type);

    return NextResponse.json({
      success: true,
      data: {
        id: curso.id,
        codigo: curso.codigo,
        nombre: curso.name,
        tipo: curso.course_type,
        studyType: normalizeStudyType(curso.course_type),
        descripcion: curso.short_description ?? '',
        area: areaName,
        duracionReferencia: curso.duration_hours ?? 0,
        precioReferencia: curso.base_price ?? 0,
        porcentajeSubvencion: curso.subsidy_percentage ?? 100,
        imagenPortada,
        imagenPortadaTipo: resolveFeaturedImageUrl(curso.featured_image) ? 'curso' : 'fallback',
        totalConvocatorias: 0,
        active: Boolean(curso.active),
        landingEnabled: Boolean(curso.landing_enabled),
        landingTargetAudience: curso.landing_target_audience ?? '',
        landingAccessRequirements: curso.landing_access_requirements ?? '',
        landingOutcomes: curso.landing_outcomes ?? '',
        dossierUrl: resolveFeaturedImageUrl(curso.dossier_pdf),
        objetivos: toTextArray(curso.landing_objectives),
        contenidos: (curso.landing_program_blocks ?? []).map((block) => ({
          title: block.title ?? '',
          body: block.body ?? '',
          items: toTextArray(block.items ?? []),
        })),
        faqs: (curso.landing_faqs ?? []).map((faq) => ({
          question: faq.question ?? '',
          answer: faq.answer ?? '',
        })),
        created_at: curso.createdAt,
        updated_at: curso.updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching course by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener curso';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cursos/[id]
 *
 * Actualiza un curso por su ID
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const payload: Payload = await getPayload({ config: configPromise });
    const authContext = await getAuthenticatedUserContext(request, payload as any);
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const existing = await payload.find({
      collection: 'courses',
      where: withTenantScope({ id: { equals: numericId } }, authContext.tenantId) as any,
      limit: 1,
      depth: 0,
    });

    if (!existing.docs[0]) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    const updated = await payload.update({
      collection: 'courses',
      id: numericId,
      data: body,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('Error updating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar curso';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

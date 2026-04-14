import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextResponse } from 'next/server';
import type { Payload } from 'payload';
import { normalizeStudyType } from '@/app/lib/website/study-types';

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
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/cursos/[id]
 *
 * Retorna un curso por su ID numérico de Payload
 */
export async function GET(
  _request: Request,
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

    const payload: Payload = await getPayloadHMR({ config: configPromise });

    const curso = await payload.findByID({
      collection: 'courses',
      id: numericId,
      depth: 2,
    }) as unknown as CourseDocument;

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

    // Extraer URL de imagen de portada
    const featuredImage = curso.featured_image;
    let imagenPortada = '/placeholder-course.svg';
    if (typeof featuredImage === 'object' && featuredImage !== null) {
      imagenPortada = `/media/${featuredImage.filename}`;
    }

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
        totalConvocatorias: 0,
        active: true,
        objetivos: [],
        contenidos: [],
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
  request: Request,
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
    const payload: Payload = await getPayloadHMR({ config: configPromise });

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

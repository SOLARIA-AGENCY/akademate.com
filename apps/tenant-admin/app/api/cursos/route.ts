import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Payload } from 'payload';
import { getPublishedCourses, getStudyTypeVisualMap } from '@/app/lib/server/published-courses';
import { normalizePublicStudyType } from '@/app/lib/website/study-types';
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth';

/**
 * TypeScript interfaces for type safety
 */
type CourseType =
  | 'desempleados'
  | 'teleformacion'
  | 'ocupados'
  | 'privado'
  | 'ciclo_medio'
  | 'ciclo_superior';

interface CursoRequestBody {
  nombre: string;
  area_formativa_id: string;
  tipo: string;
  studyType?: string;
  descripcion?: string;
  duracion_referencia?: string;
  precio_referencia?: string;
  objetivos?: string | string[];
  contenidos?: string | string[];
  landing_enabled?: boolean;
  landing_target_audience?: string;
  landing_access_requirements?: string;
  landing_outcomes?: string;
  landing_objectives?: string[];
  landing_program_blocks?: Array<{ title: string; body?: string; items?: string[] }>;
  landing_faqs?: Array<{ question: string; answer: string }>;
  dossier_pdf?: number | string;
  imagen_portada?: string;
  pdf_files?: string[];
  subvencionado?: boolean;
  subvenciones?: string[];
  porcentaje_subvencion?: string;
}

interface CourseCreateData {
  codigo: string;
  name: string;
  area_formativa: number;
  course_type: CourseType;
  short_description: string;
  duration_hours?: number;
  base_price?: number;
  subsidy_percentage: number;
  modality: string;
  active: boolean;
  featured: boolean;
  landing_enabled?: boolean;
  landing_target_audience?: string;
  landing_access_requirements?: string;
  landing_outcomes?: string;
  landing_objectives?: Array<{ text: string }>;
  landing_program_blocks?: Array<{ title: string; body?: string; items?: Array<{ text: string }> }>;
  landing_faqs?: Array<{ question: string; answer: string }>;
  dossier_pdf?: number | string;
}

function toTextItems(values: unknown): Array<{ text: string }> {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) =>
      typeof value === 'string'
        ? value
        : value && typeof value === 'object' && 'text' in value
          ? String((value as { text?: unknown }).text ?? '')
          : ''
    )
    .map((value) => value.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
}

function toProgramBlocks(values: unknown): CourseCreateData['landing_program_blocks'] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value, index) => {
      if (typeof value === 'string') {
        const text = value.trim();
        if (!text) return null;
        return { title: `Bloque ${index + 1}`, body: text, items: [] };
      }
      if (!value || typeof value !== 'object') return null;
      const record = value as { title?: unknown; body?: unknown; items?: unknown };
      const title = String(record.title ?? `Bloque ${index + 1}`).trim();
      const body = String(record.body ?? '').trim();
      return {
        title,
        body,
        items: toTextItems(record.items),
      };
    })
    .filter(Boolean)
    .filter((block) => Boolean(block.title || block.body || block.items?.length));
}

function toFaqs(values: unknown): CourseCreateData['landing_faqs'] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => {
      if (!value || typeof value !== 'object') return null;
      const record = value as { question?: unknown; answer?: unknown };
      const question = String(record.question ?? '').trim();
      const answer = String(record.answer ?? '').trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((faq): faq is NonNullable<CourseCreateData['landing_faqs']>[number] => Boolean(faq));
}

interface PayloadCourseDoc {
  id: number;
  codigo: string;
  name: string;
}

interface LoosePayloadClient {
  create: (args: { collection: string; data: Record<string, unknown> }) => Promise<unknown>;
}

/**
 * POST /api/cursos
 *
 * Crea un nuevo curso con código auto-generado
 * Body: { nombre, area_formativa_id, tipo, descripcion, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CursoRequestBody;
    const {
      nombre,
      area_formativa_id,
      tipo,
      studyType,
      descripcion,
      duracion_referencia,
      precio_referencia,
      objetivos,
      contenidos,
      landing_enabled,
      landing_target_audience,
      landing_access_requirements,
      landing_outcomes,
      landing_objectives,
      landing_program_blocks,
      landing_faqs,
      dossier_pdf,
      // Reserved for future implementation
      imagen_portada: _imagen_portada,
      pdf_files: _pdf_files,
      subvencionado: _subvencionado,
      subvenciones: _subvenciones,
      porcentaje_subvencion,
    } = body;

    // Validaciones básicas
    if (!nombre || !area_formativa_id || (!tipo && !studyType)) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: nombre, area_formativa_id, tipo|studyType' },
        { status: 400 }
      );
    }

     
    const payload: Payload = await getPayloadHMR({ config: configPromise });

    // 1. Generar código automáticamente
    const area = await payload.findByID({
      collection: 'areas-formativas',
      id: area_formativa_id,
    });

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Área formativa no encontrada' },
        { status: 404 }
      );
    }

    const TIPO_CODES: Record<string, string> = {
      privados: 'PRIV',
      ocupados: 'OCUP',
      desempleados: 'DESE',
      teleformacion: 'TELE',
    };

    // Mapeo de tipos del frontend a valores de Payload
    const TIPO_TO_COURSE_TYPE: Record<string, CourseType> = {
      privados: 'privado',
      ocupados: 'ocupados',
      desempleados: 'desempleados',
      teleformacion: 'teleformacion',
    };

    const normalizedStudyType = normalizePublicStudyType(studyType ?? tipo);
    if (!normalizedStudyType) {
      return NextResponse.json(
        { success: false, error: 'Tipo de estudio inválido para cursos (usa: privados, ocupados, desempleados o teleformacion)' },
        { status: 400 }
      );
    }

    const tipoCode = TIPO_CODES[normalizedStudyType];
    if (!tipoCode) {
      return NextResponse.json(
        { success: false, error: 'Tipo de curso inválido' },
        { status: 400 }
      );
    }

    const courseType = TIPO_TO_COURSE_TYPE[normalizedStudyType];

    const prefix = `${area.codigo}-${tipoCode}-`;

    const ultimosCursos = await payload.find({
      collection: 'courses',
      where: {
        codigo: {
          like: `${prefix}%`,
        },
      },
      sort: '-codigo',
      limit: 1,
    });

    let secuencial = 1;
    if (ultimosCursos.docs.length > 0) {
      const ultimoCurso = ultimosCursos.docs[0] as PayloadCourseDoc;
      const ultimoCodigo = ultimoCurso.codigo;
      if (ultimoCodigo) {
        const codePattern = /(\d{4})$/;
        const match = codePattern.exec(ultimoCodigo);
        if (match?.[1]) {
          secuencial = parseInt(match[1], 10) + 1;
        }
      }
    }

    const codigo = `${prefix}${secuencial.toString().padStart(4, '0')}`;

    // 2. Crear curso en Payload
    const courseData: CourseCreateData = {
      codigo,
      name: nombre,
      area_formativa: parseInt(area_formativa_id),
      course_type: courseType,
      short_description: descripcion ?? '',
      duration_hours: duracion_referencia ? parseInt(duracion_referencia) : undefined,
      base_price: precio_referencia ? parseFloat(precio_referencia) : undefined,
      subsidy_percentage: porcentaje_subvencion ? parseInt(porcentaje_subvencion) : 100,
      modality: 'presencial', // Default
      active: true,
      featured: false,
      landing_enabled: Boolean(landing_enabled),
      landing_target_audience,
      landing_access_requirements,
      landing_outcomes,
      landing_objectives: toTextItems(landing_objectives ?? (objetivos ? [objetivos] : [])),
      landing_program_blocks: toProgramBlocks(landing_program_blocks ?? (contenidos ? [contenidos] : [])),
      landing_faqs: toFaqs(landing_faqs),
      dossier_pdf,
    };

    const payloadLoose = payload as unknown as LoosePayloadClient;
    const cursoCreado = await payloadLoose.create({
      collection: 'courses',
      data: courseData as unknown as Record<string, unknown>,
    }) as unknown as PayloadCourseDoc;

    return NextResponse.json({
      success: true,
      data: {
        id: cursoCreado.id,
        codigo: cursoCreado.codigo,
        nombre: cursoCreado.name,
      },
      message: `Curso creado exitosamente con código: ${cursoCreado.codigo}`,
    });
  } catch (error: unknown) {
    console.error('Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear curso';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cursos
 *
 * Lista cursos (opcional, para debugging)
 * OPTIMIZADO: Cache de 10 segundos para reducir hits a Payload
 */
export async function GET(request?: NextRequest) {
  try {
    const payload: Payload = await getPayloadHMR({ config: configPromise });
    const authContext = request ? await getAuthenticatedUserContext(request, payload as any) : null;
    if (request && !authContext) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const url = new URL(request?.url ?? 'http://localhost/api/cursos');
    const includeInactiveParam = url.searchParams.get('includeInactive');
    const includeInactive = includeInactiveParam === '1' || includeInactiveParam === 'true';
    const requestedStudyType = url.searchParams.get('tipo') ?? url.searchParams.get('studyType');
    const limitParam = Number(url.searchParams.get('limit') || '');
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 1000;

    const courses = await getPublishedCourses({
      payload,
      tenantId: authContext?.tenantId ?? null,
      includeInactive,
      includeCycles: false,
      studyType: requestedStudyType,
      limit,
      sort: '-createdAt',
    });
    const studyTypeMeta = await getStudyTypeVisualMap(payload);

    const response = NextResponse.json({
      success: true,
      data: courses,
      total: courses.length,
      studyTypeMeta,
    });

    // Cache por 10 segundos, revalidar en background
    response.headers.set('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

    return response;
  } catch (error: unknown) {
    console.error('Error fetching courses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener cursos';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

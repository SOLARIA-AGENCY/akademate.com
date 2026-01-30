import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Payload } from 'payload';

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
  descripcion?: string;
  duracion_referencia?: string;
  precio_referencia?: string;
  objetivos?: string;
  contenidos?: string;
  imagen_portada?: string;
  pdf_files?: string[];
  subvencionado?: boolean;
  subvenciones?: string[];
  porcentaje_subvencion?: string;
}

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
  course_type: CourseType;
  short_description?: string;
  duration_hours?: number;
  base_price?: number;
  subsidy_percentage?: number;
  area_formativa?: AreaFormativa | number;
  featured_image?: FeaturedImage | number;
  createdAt: string;
  updatedAt: string;
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
}

interface PayloadCourseDoc {
  id: number;
  codigo: string;
  name: string;
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
      descripcion,
      duracion_referencia,
      precio_referencia,
      // Reserved for future implementation
      objetivos: _objetivos,
      contenidos: _contenidos,
      imagen_portada: _imagen_portada,
      pdf_files: _pdf_files,
      subvencionado: _subvencionado,
      subvenciones: _subvenciones,
      porcentaje_subvencion,
    } = body;

    // Validaciones básicas
    if (!nombre || !area_formativa_id || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: nombre, area_formativa_id, tipo' },
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

    const tipoCode = TIPO_CODES[tipo];
    if (!tipoCode) {
      return NextResponse.json(
        { success: false, error: 'Tipo de curso inválido' },
        { status: 400 }
      );
    }

    const courseType = TIPO_TO_COURSE_TYPE[tipo];

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
      // TODO: Agregar objetivos, contenidos, PDFs cuando se implementen
    };

    const cursoCreado = await payload.create({
      collection: 'courses',
      data: courseData,
    }) as PayloadCourseDoc;

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
export async function GET() {
  try {
     
    const payload: Payload = await getPayloadHMR({ config: configPromise });

    const cursos = await payload.find({
      collection: 'courses',
      limit: 100,
      sort: '-createdAt',
      depth: 2, // Populate relationships (area_formativa)
    });

    const response = NextResponse.json({
      success: true,
      data: cursos.docs.map((curso: CourseDocument) => {
        // Extract area name (can be object or ID)
        const areaFormativa = curso.area_formativa;
        let areaName = 'Sin área';
        if (typeof areaFormativa === 'object' && areaFormativa !== null) {
          areaName = areaFormativa.nombre ?? 'Sin área';
        }

        // Extract featured image URL (build from filename to avoid Payload transformation)
        const featuredImage = curso.featured_image;
        let imagenPortada = '/placeholder-course.svg';
        if (typeof featuredImage === 'object' && featuredImage !== null) {
          imagenPortada = `/media/${featuredImage.filename}`;
        }

        return {
          id: curso.id,
          codigo: curso.codigo,
          nombre: curso.name,
          tipo: curso.course_type,
          descripcion: curso.short_description ?? 'Curso de formación profesional',
          area: areaName,
          duracionReferencia: curso.duration_hours ?? 0,
          precioReferencia: curso.base_price ?? 0,
          porcentajeSubvencion: curso.subsidy_percentage ?? 100, // Porcentaje de subvención (default 100%)
          imagenPortada,
          totalConvocatorias: 0, // TODO: Contar convocatorias activas
        };
      }),
      total: cursos.totalDocs,
    });

    // Cache por 10 segundos, revalidar en background
    response.headers.set('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

    return response;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener cursos' },
      { status: 500 }
    );
  }
}

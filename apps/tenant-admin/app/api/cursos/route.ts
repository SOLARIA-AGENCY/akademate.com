import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/cursos
 *
 * Crea un nuevo curso con código auto-generado
 * Body: { nombre, area_formativa_id, tipo, descripcion, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      area_formativa_id,
      tipo,
      descripcion,
      duracion_referencia,
      precio_referencia,
      objetivos,
      contenidos,
      imagen_portada,
      pdf_files,
      subvencionado,
      subvenciones,
      porcentaje_subvencion,
    } = body;

    // Validaciones básicas
    if (!nombre || !area_formativa_id || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: nombre, area_formativa_id, tipo' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });

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
    const TIPO_TO_COURSE_TYPE: Record<string, string> = {
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
      const ultimoCodigo = ultimosCursos.docs[0].codigo;
      const match = ultimoCodigo.match(/(\d{4})$/);
      if (match) {
        secuencial = parseInt(match[1], 10) + 1;
      }
    }

    const codigo = `${prefix}${secuencial.toString().padStart(4, '0')}`;

    // 2. Crear curso en Payload
    const curso = await payload.create({
      collection: 'courses',
      data: {
        codigo,
        name: nombre,
        area_formativa: parseInt(area_formativa_id),
        course_type: courseType,
        short_description: descripcion || '',
        duration_hours: duracion_referencia ? parseInt(duracion_referencia) : undefined,
        base_price: precio_referencia ? parseFloat(precio_referencia) : undefined,
        subsidy_percentage: porcentaje_subvencion ? parseInt(porcentaje_subvencion) : 100,
        modality: 'presencial', // Default
        active: true,
        featured: false,
        // TODO: Agregar objetivos, contenidos, PDFs cuando se implementen
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: curso.id,
        codigo: curso.codigo,
        nombre: curso.name,
      },
      message: `Curso creado exitosamente con código: ${curso.codigo}`,
    });
  } catch (error: any) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al crear curso',
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
    const payload = await getPayloadHMR({ config: configPromise });

    const cursos = await payload.find({
      collection: 'courses',
      limit: 100,
      sort: '-createdAt',
      depth: 2, // Populate relationships (area_formativa)
    });

    const response = NextResponse.json({
      success: true,
      data: cursos.docs.map((curso: any) => ({
        id: curso.id,
        codigo: curso.codigo,
        nombre: curso.name,
        tipo: curso.course_type,
        descripcion: curso.short_description || 'Curso de formación profesional',
        // Extraer nombre del área formativa (puede ser objeto o ID)
        area: typeof curso.area_formativa === 'object'
          ? curso.area_formativa?.nombre || 'Sin área'
          : 'Sin área',
        duracionReferencia: curso.duration_hours || 0,
        precioReferencia: curso.base_price || 0,
        porcentajeSubvencion: curso.subsidy_percentage || 100, // Porcentaje de subvención (default 100%)
        // Imagen del curso (construir URL desde filename para evitar transformación de Payload)
        imagenPortada: typeof curso.featured_image === 'object' && curso.featured_image?.filename
          ? `/media/${curso.featured_image.filename}` // URL relativa local
          : '/placeholder-course.svg',
        totalConvocatorias: 0, // TODO: Contar convocatorias activas
      })),
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

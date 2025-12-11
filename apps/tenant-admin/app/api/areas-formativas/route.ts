import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/areas-formativas
 *
 * Retorna todas las áreas formativas activas
 * Usado por frontend para dropdown en formulario de creación de cursos
 * OPTIMIZADO: Cache de 60 segundos (datos maestros que cambian poco)
 */
export async function GET() {
  try {
    const payload = await getPayloadHMR({ config: configPromise });

    const areas = await payload.find({
      collection: 'areas-formativas',
      where: {
        activo: {
          equals: true,
        },
      },
      sort: 'nombre',
      limit: 100,
    });

    const response = NextResponse.json({
      success: true,
      data: areas.docs.map((area) => ({
        id: area.id,
        nombre: area.nombre,
        codigo: area.codigo,
        color: area.color,
      })),
    });

    // Cache por 60 segundos (datos maestros estables)
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error('Error fetching areas formativas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener áreas formativas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/areas-formativas
 *
 * Crea una nueva área formativa
 * Body: { nombre, codigo, descripcion?, color?, activo? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, codigo, descripcion, color, activo } = body;

    // Validaciones básicas
    if (!nombre || !codigo) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: nombre, codigo' },
        { status: 400 }
      );
    }

    // Validar formato de código (3-4 letras mayúsculas)
    if (!/^[A-Z]{3,4}$/.test(codigo)) {
      return NextResponse.json(
        { success: false, error: 'El código debe tener 3-4 letras mayúsculas (ej: MKT, DEV)' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });

    // Verificar si ya existe un área con ese código
    const existing = await payload.find({
      collection: 'areas-formativas',
      where: {
        codigo: {
          equals: codigo,
        },
      },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      return NextResponse.json(
        { success: false, error: `Ya existe un área con el código ${codigo}` },
        { status: 409 }
      );
    }

    // Crear área formativa
    const area = await payload.create({
      collection: 'areas-formativas',
      data: {
        nombre,
        codigo,
        descripcion: descripcion || '',
        color: color || '',
        activo: activo !== undefined ? activo : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: area.id,
        nombre: area.nombre,
        codigo: area.codigo,
        color: area.color,
        activo: area.activo,
      },
      message: `Área formativa ${area.nombre} creada exitosamente`,
    });
  } catch (error: any) {
    console.error('Error creating area formativa:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al crear área formativa',
      },
      { status: 500 }
    );
  }
}

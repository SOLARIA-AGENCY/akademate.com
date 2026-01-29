import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Payload } from 'payload';

/**
 * Interface for area formativa request body
 */
interface AreaFormativaRequestBody {
  nombre: string;
  codigo: string;
  descripcion?: string;
  color?: string;
  activo?: boolean;
}

/**
 * Interface for area formativa document
 */
interface AreaFormativaDoc {
  id: string;
  nombre: string;
  codigo: string;
  color?: string;
  activo?: boolean;
}

/**
 * GET /api/areas-formativas
 *
 * Retorna todas las áreas formativas activas
 * Usado por frontend para dropdown en formulario de creación de cursos
 * OPTIMIZADO: Cache de 60 segundos (datos maestros que cambian poco)
 */
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Payload library returns error-typed Promise
    const payload: Payload = await getPayloadHMR({ config: configPromise });

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
      data: areas.docs.map((area) => {
        const doc = area as AreaFormativaDoc;
        return {
          id: doc.id,
          nombre: doc.nombre,
          codigo: doc.codigo,
          color: doc.color,
        };
      }),
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
    const body = (await request.json()) as AreaFormativaRequestBody;
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Payload library returns error-typed Promise
    const payload: Payload = await getPayloadHMR({ config: configPromise });

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
        descripcion: descripcion ?? '',
        color: color ?? '',
        activo: activo ?? true,
      },
    });

    const createdArea = area as AreaFormativaDoc;

    return NextResponse.json({
      success: true,
      data: {
        id: createdArea.id,
        nombre: createdArea.nombre,
        codigo: createdArea.codigo,
        color: createdArea.color,
        activo: createdArea.activo,
      },
      message: `Área formativa ${createdArea.nombre} creada exitosamente`,
    });
  } catch (error: unknown) {
    console.error('Error creating area formativa:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear área formativa';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

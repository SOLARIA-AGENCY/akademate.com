import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextResponse } from 'next/server';
import type { Payload } from 'payload';

interface AreaFormativaDocument {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/areas-formativas
 *
 * Lista todas las áreas formativas desde Payload CMS
 */
export async function GET() {
  try {
    const payload: Payload = await getPayloadHMR({ config: configPromise });

    const result = await payload.find({
      collection: 'areas-formativas',
      limit: 100,
      sort: 'nombre',
    });

    const areas = result.docs as unknown as AreaFormativaDocument[];

    return NextResponse.json({
      success: true,
      data: areas.map((area) => ({
        id: area.id,
        codigo: area.codigo,
        nombre: area.nombre,
        descripcion: area.descripcion ?? '',
        active: area.activo ?? true,
      })),
      total: result.totalDocs,
    });
  } catch (error: unknown) {
    console.error('Error fetching areas formativas:', error);
    // Fallback defensivo: retornar vacío en lugar de 500
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      warning: 'Áreas formativas no disponibles temporalmente.',
    });
  }
}

/**
 * POST /api/areas-formativas
 *
 * Crea una nueva área formativa
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as { codigo: string; nombre: string; descripcion?: string };

    if (!body.codigo || !body.nombre) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: codigo, nombre' },
        { status: 400 }
      );
    }

    const payload: Payload = await getPayloadHMR({ config: configPromise });

    const area = await payload.create({
      collection: 'areas-formativas',
      data: {
        codigo: body.codigo,
        nombre: body.nombre,
        descripcion: body.descripcion ?? '',
        activo: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: area,
      message: 'Área formativa creada exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error creating area formativa:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear área formativa';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

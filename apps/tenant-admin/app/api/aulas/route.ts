import { getPayload } from 'payload'
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Payload } from 'payload';

interface ClassroomDocument {
  id: number;
  code: string;
  name: string;
  capacity: number;
  floor?: number | null;
  resources?: string[] | null;
  usage_policy?: string | null;
  enabled_shifts?: string[] | null;
  data_quality_status?: string | null;
  operational_notes?: string | null;
  campus: number | { id: number; name: string; city?: string } | null;
  is_active?: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateAulaRequest {
  code: string;
  name: string;
  capacity: number;
  campusId: number;
  floor?: number;
  resources?: string[];
  notes?: string;
}

/**
 * GET /api/aulas?campus_id=X&active=true
 *
 * Lista todas las aulas, opcionalmente filtradas por campus
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campus_id');
    const activeOnly = searchParams.get('active') !== 'false'; // default: only active

    const payload: Payload = await getPayload({ config: configPromise });

    // Build where clause
    const where: Record<string, unknown> = {};
    if (activeOnly) {
      where.is_active = { equals: true };
    }
    if (campusId) {
      where.campus = { equals: parseInt(campusId, 10) };
    }

    const result = await payload.find({
      collection: 'classrooms',
      where,
      limit: 200,
      sort: 'code',
      depth: 1, // Populate campus relation
    });

    const classrooms = result.docs as unknown as ClassroomDocument[];

    return NextResponse.json({
      success: true,
      data: classrooms.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        nombre: c.name,
        capacity: c.capacity,
        capacidad: c.capacity,
        planta: c.floor ?? null,
        recursos: c.resources ?? [],
        usage_policy: c.usage_policy ?? 'mixed',
        enabled_shifts: c.enabled_shifts ?? ['morning', 'afternoon'],
        data_quality_status: c.data_quality_status ?? 'complete',
        operational_notes: c.operational_notes ?? '',
        campusId: typeof c.campus === 'object' && c.campus !== null ? c.campus.id : c.campus,
        sedeId: typeof c.campus === 'object' && c.campus !== null ? c.campus.id : c.campus,
        sedeNombre: typeof c.campus === 'object' && c.campus !== null ? c.campus.name : null,
        activa: c.is_active ?? true,
        notas: c.notes ?? '',
      })),
      total: result.totalDocs,
    });
  } catch (error: unknown) {
    console.error('Error fetching aulas:', error);
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      warning: 'Aulas no disponibles temporalmente.',
    });
  }
}

/**
 * POST /api/aulas
 *
 * Crea una nueva aula
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateAulaRequest;

    if (!body.code || !body.name || !body.capacity || !body.campusId) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: code, name, capacity, campusId' },
        { status: 400 }
      );
    }

    const payload: Payload = await getPayload({ config: configPromise });

    const createClassroom = payload.create as unknown as (args: Record<string, unknown>) => Promise<unknown>;
    const aula = await createClassroom({
      collection: 'classrooms',
      data: {
        code: body.code.trim().toUpperCase(),
        name: body.name.trim(),
        capacity: body.capacity,
        campus: body.campusId,
        floor: body.floor ?? null,
        resources: (body.resources ?? []) as ('projector' | 'whiteboard' | 'computers' | 'lab' | 'av' | 'ac' | 'wifi')[],
        is_active: true,
        notes: body.notes ?? '',
      },
    });

    return NextResponse.json({
      success: true,
      data: aula,
      message: 'Aula creada exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error creating aula:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear aula';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

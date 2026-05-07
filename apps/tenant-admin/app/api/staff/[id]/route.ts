import { NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { Payload } from 'payload';

interface CampusRel {
  id: number;
  name: string;
  city: string;
}

interface StaffDocument {
  id: number;
  staff_type: 'profesor' | 'administrativo';
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  position: string;
  contract_type: string;
  employment_status: string;
  hire_date: string;
  bio?: string;
  is_active: boolean;
  photo?: { id: number; filename?: string; url?: string | null } | number;
  assigned_campuses?: (CampusRel | number)[];
  createdAt: string;
  updatedAt: string;
}

function resolveMediaUrl(photo?: StaffDocument['photo']): { id: number | null; url: string } {
  if (typeof photo === 'object' && photo !== null) {
    const filename = photo.filename?.trim()
    return {
      id: photo.id,
      url: photo.url || (filename ? `/api/media/file/${filename}` : '/placeholder-avatar.svg'),
    }
  }

  return { id: typeof photo === 'number' ? photo : null, url: '/placeholder-avatar.svg' }
}

/**
 * GET /api/staff/[id]
 *
 * Retorna un miembro del personal por su ID
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

    const staffMember = await payload.findByID({
      collection: 'staff',
      id: numericId,
      depth: 2,
      overrideAccess: true,
    }) as unknown as StaffDocument;

    if (!staffMember) {
      return NextResponse.json(
        { success: false, error: 'Miembro del personal no encontrado' },
        { status: 404 }
      );
    }

    // Extraer foto
    const photo = resolveMediaUrl(staffMember.photo);

    // Extraer campuses asignados
    const campuses = (staffMember.assigned_campuses ?? [])
      .filter((c): c is CampusRel => typeof c === 'object' && c !== null)
      .map((c) => ({ id: c.id, name: c.name, city: c.city }));

    return NextResponse.json({
      success: true,
      data: {
        id: staffMember.id,
        staffType: staffMember.staff_type,
        firstName: staffMember.first_name,
        lastName: staffMember.last_name,
        fullName: staffMember.full_name ?? `${staffMember.first_name} ${staffMember.last_name}`,
        email: staffMember.email,
        phone: staffMember.phone ?? null,
        position: staffMember.position,
        contractType: staffMember.contract_type,
        employmentStatus: staffMember.employment_status,
        hireDate: staffMember.hire_date,
        bio: staffMember.bio ?? null,
        photoId: photo.id,
        photo: photo.url,
        assignedCampuses: campuses,
        isActive: staffMember.is_active,
        createdAt: staffMember.createdAt,
        updatedAt: staffMember.updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching staff by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener personal';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

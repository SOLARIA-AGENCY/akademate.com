import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getPayload, type Payload, type SanitizedConfig } from 'payload';
import configPromise from '@payload-config';
import type { Staff } from '../../../src/payload-types';

/**
 * Initialize Payload CMS instance.
 *
 * This wrapper centralizes Payload initialization for API routes.
 */
const initPayload = async (): Promise<Payload> => {
  // Cast config to satisfy ESLint's strict type checking
  // The configPromise is typed by Payload's buildConfig as Promise<SanitizedConfig>
  const config = (await configPromise) as SanitizedConfig;
  return getPayload({ config });
};

const dbConnectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URI;
// PostgreSQL connection - support canonical DATABASE_URL first
const sql = dbConnectionString ? postgres(dbConnectionString) : null;

// ============================================================================
// Type Definitions
// ============================================================================

/** Campus data returned from SQL JSON aggregation */
interface CampusData {
  id: number;
  name: string;
  city: string;
}

/** Course run data returned from SQL JSON aggregation */
interface CourseRunData {
  id: number;
  codigo: string;
  status: string;
  startDate: string;
  endDate: string;
  courseName: string;
  courseSlug: string;
  campusName: string;
  campusCity: string;
}

/** Raw staff row returned from SQL query */
interface StaffQueryRow {
  id: number;
  staff_type: 'profesor' | 'administrativo';
  first_name: string;
  last_name: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  position: string;
  contract_type: 'full_time' | 'part_time' | 'freelance';
  employment_status: 'active' | 'temporary_leave' | 'inactive';
  hire_date: string;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  photo_filename: string | null;
  campuses: CampusData[];
  course_runs: CourseRunData[];
}

/** Request body for creating a staff member */
interface CreateStaffBody {
  staffType: 'profesor' | 'administrativo';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  contractType?: 'full_time' | 'part_time' | 'freelance';
  employmentStatus?: 'active' | 'temporary_leave' | 'inactive';
  hireDate: string;
  bio?: string;
  specialties?: Staff['specialties'];
  certifications?: {
    title: string;
    institution: string;
    year: number;
    document?: number;
  }[];
  assignedCampuses: (string | number)[];
  photoId?: string | number;
}

/** Request body for updating a staff member */
interface UpdateStaffBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  position?: string;
  contractType?: 'full_time' | 'part_time' | 'freelance';
  employmentStatus?: 'active' | 'temporary_leave' | 'inactive';
  hireDate?: string;
  bio?: string | null;
  photoId?: string | number | null;
  specialties?: Staff['specialties'];
  certifications?: {
    title: string;
    institution: string;
    year: number;
    document?: number;
  }[];
  assignedCampuses?: (string | number)[];
  isActive?: boolean;
}

/** Data structure for Payload CMS staff updates */
interface StaffUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  position?: string;
  contract_type?: 'full_time' | 'part_time' | 'freelance';
  employment_status?: 'active' | 'temporary_leave' | 'inactive';
  hire_date?: string;
  bio?: string | null;
  photo?: number | null;
  specialties?: Staff['specialties'];
  certifications?: {
    title: string;
    institution: string;
    year: number;
    document?: number;
  }[];
  assigned_campuses?: number[];
  is_active?: boolean;
}

/** Helper to extract error message from unknown error */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/staff?type=instructor|administrative&campus=X&status=active
 *
 * Lista miembros del personal con filtros opcionales (SQL directo)
 */
export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const staffType = searchParams.get('type'); // 'profesor' | 'administrativo'
    const campusId = searchParams.get('campus');
    const employmentStatus = searchParams.get('status'); // 'active' | 'temporary_leave' | 'inactive'
    const limit = parseInt(searchParams.get('limit') ?? '50');

    // Build dynamic WHERE clause
    const conditions = ['s.is_active = true'];
    const params: string[] = [];

    if (staffType) {
      params.push(staffType);
      conditions.push(`s.staff_type = $${params.length}`);
    }

    if (employmentStatus) {
      params.push(employmentStatus);
      conditions.push(`s.employment_status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query staff with photo, campus relationships, and assigned course runs
    const query = `
      SELECT
        s.id,
        s.staff_type,
        s.first_name,
        s.last_name,
        s.full_name,
        s.email,
        s.phone,
        s.position,
        s.contract_type,
        s.employment_status,
        s.hire_date,
        s.bio,
        s.is_active,
        s.created_at,
        s.updated_at,
        m.filename as photo_filename,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'city', c.city)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) as campuses,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', cr.id,
              'codigo', cr.codigo,
              'status', cr.status,
              'startDate', cr.start_date,
              'endDate', cr.end_date,
              'courseName', course.name,
              'courseSlug', course.slug,
              'campusName', camp.name,
              'campusCity', camp.city
            )
          ) FILTER (WHERE cr.id IS NOT NULL),
          '[]'::json
        ) as course_runs
      FROM staff s
      LEFT JOIN media m ON s.photo_id = m.id
      LEFT JOIN staff_rels sr ON sr.parent_id = s.id AND sr.path = 'assigned_campuses'
      LEFT JOIN campuses c ON c.id = sr.campuses_id
      LEFT JOIN course_runs cr ON cr.instructor_id = s.id
      LEFT JOIN courses course ON course.id = cr.course_id
      LEFT JOIN campuses camp ON camp.id = cr.campus_id
      ${whereClause}
      ${campusId ? `AND EXISTS (SELECT 1 FROM staff_rels sr2 WHERE sr2.parent_id = s.id AND sr2.campuses_id = ${parseInt(campusId)})` : ''}
      GROUP BY s.id, m.filename
      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `;

    const staff = await sql.unsafe(query, params) as StaffQueryRow[];

    return NextResponse.json({
      success: true,
      data: staff.map((member) => ({
        id: member.id,
        staffType: member.staff_type,
        firstName: member.first_name,
        lastName: member.last_name,
        fullName: member.full_name,
        email: member.email,
        phone: member.phone,
        position: member.position,
        contractType: member.contract_type,
        employmentStatus: member.employment_status,
        hireDate: member.hire_date,
        photo: member.photo_filename ? `/media/${member.photo_filename}` : '/placeholder-avatar.svg',
        bio: member.bio,
        assignedCampuses: member.campuses || [],
        courseRuns: member.course_runs || [],
        courseRunsCount: Array.isArray(member.course_runs) ? member.course_runs.length : 0,
        isActive: member.is_active,
        createdAt: member.created_at,
        updatedAt: member.updated_at,
      })),
      total: staff.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || 'Error al obtener personal' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff
 *
 * Crea un nuevo miembro del personal
 */
export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json() as CreateStaffBody;
    const {
      staffType,
      firstName,
      lastName,
      email,
      phone,
      position,
      contractType,
      employmentStatus,
      hireDate,
      bio,
      specialties,
      certifications,
      assignedCampuses,
      photoId,
    } = body;

    // Validaciones básicas
    if (!staffType || !firstName || !lastName || !email || !position || !hireDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos requeridos: staffType, firstName, lastName, email, position, hireDate',
        },
        { status: 400 }
      );
    }

    if (!assignedCampuses || assignedCampuses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe asignar al menos una sede' },
        { status: 400 }
      );
    }

    const payload = await initPayload();

    // Crear miembro del personal
    const staffMember = await payload.create({
      collection: 'staff',
      data: {
        staff_type: staffType,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone ?? undefined,
        position,
        contract_type: contractType ?? 'full_time',
        employment_status: employmentStatus ?? 'active',
        hire_date: hireDate,
        bio: bio ?? undefined,
        photo: photoId ? parseInt(String(photoId)) : undefined,
        specialties: (specialties ?? []) as Staff['specialties'],
        certifications: certifications ?? [],
        assigned_campuses: assignedCampuses.map((id) => typeof id === 'string' ? parseInt(id) : id),
        is_active: true,
      },
    }) as unknown as Staff;

    return NextResponse.json({
      success: true,
      data: {
        id: staffMember.id,
        fullName: staffMember.full_name,
      },
      message: 'Miembro del personal creado exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || 'Error al crear miembro del personal',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/staff/:id
 *
 * Actualiza un miembro del personal
 */
export async function PUT(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    const body = await request.json() as UpdateStaffBody;
    const payload = await initPayload();

    // Preparar datos de actualización
    const updateData: StaffUpdateData = {};

    if (body.firstName) updateData.first_name = body.firstName;
    if (body.lastName) updateData.last_name = body.lastName;
    if (body.email) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.position) updateData.position = body.position;
    if (body.contractType) updateData.contract_type = body.contractType;
    if (body.employmentStatus) updateData.employment_status = body.employmentStatus;
    if (body.hireDate) updateData.hire_date = body.hireDate;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.photoId !== undefined) updateData.photo = body.photoId ? parseInt(String(body.photoId)) : null;
    if (body.specialties) updateData.specialties = body.specialties as Staff['specialties'];
    if (body.certifications) updateData.certifications = body.certifications;
    if (body.assignedCampuses)
      updateData.assigned_campuses = body.assignedCampuses.map((cid) => typeof cid === 'string' ? parseInt(cid) : cid);
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const staffMember = await payload.update({
      collection: 'staff',
      id: parseInt(id),
      data: updateData as unknown as Record<string, unknown>,
    }) as unknown as Staff;

    return NextResponse.json({
      success: true,
      data: {
        id: staffMember.id,
        fullName: staffMember.full_name,
      },
      message: 'Miembro del personal actualizado exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error updating staff member:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || 'Error al actualizar miembro del personal',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/:id
 *
 * Elimina (desactiva) un miembro del personal
 * Nota: No se elimina físicamente, solo se marca como inactivo
 */
export async function DELETE(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    const payload = await initPayload();

    // En lugar de eliminar, marcamos como inactivo (soft delete)
    await payload.update({
      collection: 'staff',
      id: parseInt(id),
      data: {
        is_active: false,
        employment_status: 'inactive',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Miembro del personal desactivado exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || 'Error al eliminar miembro del personal',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import postgres from 'postgres'

interface CampusRel {
  id: number;
  name: string;
  city: string;
}

interface AreaRel {
  id: number;
  nombre: string;
  codigo?: string | null;
}

interface StaffDocument {
  id: number;
  staff_type: 'profesor' | 'administrativo';
  first_name: string;
  last_name: string;
  full_name?: string;
  nif?: string | null;
  email: string;
  phone?: string;
  position: string;
  contract_type: string;
  employment_status: string;
  inactive_reason?: string | null;
  inactive_at?: string | null;
  reactivated_at?: string | null;
  import_review_status?: string | null;
  last_import_batch?: string | null;
  hire_date: string;
  bio?: string;
  is_active: boolean;
  photo?: { id: number; filename?: string; url?: string | null } | number;
  assigned_campuses?: (CampusRel | number)[];
  qualified_areas?: (AreaRel | number)[];
  createdAt: string;
  updatedAt: string;
}

interface StaffDetailRow {
  id: number
  staff_type: StaffDocument['staff_type']
  first_name: string
  last_name: string
  full_name: string | null
  nif: string | null
  email: string | null
  phone: string | null
  position: string
  contract_type: string
  employment_status: string
  inactive_reason: string | null
  inactive_at: string | null
  reactivated_at: string | null
  import_review_status: string | null
  last_import_batch: string | null
  hire_date: string | null
  bio: string | null
  is_active: boolean
  photo_id: number | null
  photo_filename: string | null
  photo_url: string | null
  assigned_campuses: CampusRel[]
  qualified_areas: AreaRel[]
  created_at: string
  updated_at: string
}

const dbConnectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URI
const sql = dbConnectionString ? postgres(dbConnectionString) : null

function resolveMediaUrl(filename?: string | null, url?: string | null): string {
  if (url && url.trim().length > 0) return url
  if (filename && filename.trim().length > 0) return `/api/media/file/${filename}`
  return '/placeholder-avatar.svg'
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
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff/[id]' },
      { status: 503 },
    )
  }

  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const rows = await sql<StaffDetailRow[]>`
      SELECT
        s.id,
        s.staff_type,
        s.first_name,
        s.last_name,
        s.full_name,
        s.nif,
        s.email,
        s.phone,
        s.position,
        s.contract_type,
        s.employment_status,
        s.inactive_reason,
        s.inactive_at,
        s.reactivated_at,
        s.import_review_status,
        s.last_import_batch,
        s.hire_date,
        s.bio,
        s.is_active,
        s.photo_id,
        m.filename AS photo_filename,
        m.url AS photo_url,
        s.created_at,
        s.updated_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'city', c.city)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) AS assigned_campuses,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', a.id, 'nombre', a.nombre, 'codigo', a.codigo)
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'::json
        ) AS qualified_areas
      FROM staff s
      LEFT JOIN media m ON m.id = s.photo_id
      LEFT JOIN staff_rels sr_campus ON sr_campus.parent_id = s.id AND sr_campus.path = 'assigned_campuses'
      LEFT JOIN campuses c ON c.id = sr_campus.campuses_id
      LEFT JOIN staff_rels sr_area ON sr_area.parent_id = s.id AND sr_area.path = 'qualified_areas'
      LEFT JOIN areas_formativas a ON a.id = sr_area.areas_formativas_id
      WHERE s.id = ${numericId}
      GROUP BY s.id, m.filename, m.url
      LIMIT 1
    `

    const staffMember = rows[0];

    if (!staffMember) {
      return NextResponse.json(
        { success: false, error: 'Miembro del personal no encontrado' },
        { status: 404 }
      );
    }

    const photo = resolveMediaUrl(staffMember.photo_filename, staffMember.photo_url);

    return NextResponse.json({
      success: true,
      data: {
        id: staffMember.id,
        staffType: staffMember.staff_type,
        firstName: staffMember.first_name,
        lastName: staffMember.last_name,
        fullName: staffMember.full_name ?? `${staffMember.first_name} ${staffMember.last_name}`,
        nif: staffMember.nif ?? null,
        email: staffMember.email,
        phone: staffMember.phone ?? null,
        position: staffMember.position,
        contractType: staffMember.contract_type,
        employmentStatus: staffMember.employment_status,
        inactiveReason: staffMember.inactive_reason ?? null,
        inactiveAt: staffMember.inactive_at ?? null,
        reactivatedAt: staffMember.reactivated_at ?? null,
        importReviewStatus: staffMember.import_review_status ?? 'validated',
        lastImportBatch: staffMember.last_import_batch ?? null,
        hireDate: staffMember.hire_date,
        bio: staffMember.bio ?? null,
        photoId: staffMember.photo_id,
        photo,
        assignedCampuses: staffMember.assigned_campuses ?? [],
        qualifiedAreas: staffMember.qualified_areas ?? [],
        isActive: staffMember.is_active,
        createdAt: staffMember.created_at,
        updatedAt: staffMember.updated_at,
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

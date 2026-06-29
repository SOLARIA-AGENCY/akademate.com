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

interface CertificationRel {
  id: number;
  title: string;
  institution?: string | null;
  year?: number | null;
}

interface CourseRunRel {
  id: number;
  codigo: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  courseName: string | null;
  courseSlug: string | null;
  courseImage: string | null;
  campusName: string | null;
  campusCity: string | null;
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
  certifications: CertificationRel[]
  course_runs: CourseRunRel[]
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
        COALESCE(campuses.data, '[]'::json) AS assigned_campuses,
        COALESCE(areas.data, '[]'::json) AS qualified_areas,
        COALESCE(certifications.data, '[]'::json) AS certifications,
        COALESCE(course_runs.data, '[]'::json) AS course_runs
      FROM staff s
      LEFT JOIN media m ON m.id = s.photo_id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          jsonb_build_object('id', rel.id, 'name', rel.name, 'city', rel.city)
          ORDER BY rel.name
        ) AS data
        FROM (
          SELECT DISTINCT c.id, c.name, c.city
          FROM staff_rels sr_campus
          JOIN campuses c ON c.id = sr_campus.campuses_id
          WHERE sr_campus.parent_id = s.id
            AND sr_campus.path = 'assigned_campuses'
        ) rel
      ) campuses ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
          jsonb_build_object('id', rel.id, 'nombre', rel.nombre, 'codigo', rel.codigo)
          ORDER BY rel.nombre
        ) AS data
        FROM (
          SELECT DISTINCT a.id, a.nombre, a.codigo
          FROM staff_rels sr_area
          JOIN areas_formativas a ON a.id = sr_area.areas_formativas_id
          WHERE sr_area.parent_id = s.id
            AND sr_area.path = 'qualified_areas'
        ) rel
      ) areas ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
          jsonb_build_object(
            'id', cert.id,
            'title', cert.title,
            'institution', cert.institution,
            'year', cert.year
          )
          ORDER BY cert.id
        ) AS data
        FROM staff_certifications cert
        WHERE cert._parent_id = s.id
      ) certifications ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
          jsonb_build_object(
            'id', rel.id,
            'codigo', rel.codigo,
            'status', rel.status,
            'startDate', rel.start_date,
            'endDate', rel.end_date,
            'courseName', COALESCE(rel.course_name, rel.cycle_name, rel.codigo),
            'courseSlug', COALESCE(rel.course_slug, rel.cycle_slug),
            'courseImage', rel.course_image,
            'campusName', rel.campus_name,
            'campusCity', rel.campus_city
          )
          ORDER BY rel.start_date DESC NULLS LAST, rel.id DESC
        ) AS data
        FROM (
          SELECT DISTINCT ON (cr.id)
            cr.id,
            cr.codigo,
            cr.status,
            cr.start_date,
            cr.end_date,
            course.name AS course_name,
            course.slug AS course_slug,
            cycle.name AS cycle_name,
            cycle.slug AS cycle_slug,
            CASE
              WHEN course_media.url IS NOT NULL AND course_media.url <> '' THEN course_media.url
              WHEN course_media.filename IS NOT NULL AND course_media.filename <> '' THEN '/api/media/file/' || course_media.filename
              ELSE NULL
            END AS course_image,
            camp.name AS campus_name,
            camp.city AS campus_city
          FROM course_runs cr
          LEFT JOIN course_runs_rels crr
            ON crr.parent_id = cr.id
            AND crr.path = 'instructors'
          LEFT JOIN courses course ON course.id = cr.course_id
          LEFT JOIN cycles cycle ON cycle.id = cr.cycle_id
          LEFT JOIN media course_media ON course_media.id = course.featured_image_id
          LEFT JOIN campuses camp ON camp.id = cr.campus_id
          WHERE cr.instructor_id = s.id
             OR crr.staff_id = s.id
          ORDER BY cr.id, cr.start_date DESC NULLS LAST
        ) rel
      ) course_runs ON true
      WHERE s.id = ${numericId}
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
        certifications: staffMember.certifications ?? [],
        courseRuns: staffMember.course_runs ?? [],
        courseRunsCount: Array.isArray(staffMember.course_runs) ? staffMember.course_runs.length : 0,
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

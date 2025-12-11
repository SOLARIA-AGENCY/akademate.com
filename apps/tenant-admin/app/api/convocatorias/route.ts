import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';
import type { ScheduleEntry } from '@payload-config/components/ui/ScheduleBuilder';

interface CreateConvocationRequest {
  courseId: string;
  fechaInicio: string;
  fechaFin: string;
  horario: ScheduleEntry[];
  modalidad: string;
  estado: string;
  plazasTotales: number;
  precio: number;
  profesorId: string;
  sedeId: string;
  aulaId: string;
}

/**
 * POST /api/convocatorias
 *
 * Crea una nueva convocatoria para un curso
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateConvocationRequest = await request.json();
    const {
      courseId,
      fechaInicio,
      fechaFin,
      horario,
      modalidad,
      estado,
      plazasTotales,
      precio,
      profesorId,
      sedeId,
      aulaId,
    } = body;

    // Validaciones básicas
    if (!courseId || !fechaInicio || !fechaFin || !horario || horario.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: courseId, fechaInicio, fechaFin, horario' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });

    // Verificar que el curso existe
    const course = await payload.findByID({
      collection: 'courses',
      id: parseInt(courseId),
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Convertir horario a formato de cadena para almacenar
    const horarioFormatted = horario
      .map((entry: ScheduleEntry) => {
        const dayLabels: Record<string, string> = {
          monday: 'Lunes',
          tuesday: 'Martes',
          wednesday: 'Miércoles',
          thursday: 'Jueves',
          friday: 'Viernes',
          saturday: 'Sábado',
          sunday: 'Domingo',
        };
        const dayLabel = dayLabels[entry.day] || entry.day;
        return `${dayLabel} ${entry.startTime}-${entry.endTime}`;
      })
      .join(', ');

    // Find earliest start time and latest end time across all schedule entries
    const startTimes = horario.map((e: ScheduleEntry) => e.startTime);
    const endTimes = horario.map((e: ScheduleEntry) => e.endTime);

    const earliestStart = startTimes.sort()[0] || '09:00:00';
    const latestEnd = endTimes.sort().reverse()[0] || '14:00:00';

    // Parse and validate campus ID
    let campusId: number | undefined = undefined;
    if (sedeId) {
      const parsedCampusId = parseInt(sedeId, 10);
      if (isNaN(parsedCampusId)) {
        return NextResponse.json(
          { success: false, error: `Invalid campus ID: ${sedeId}` },
          { status: 400 }
        );
      }
      campusId = parsedCampusId;
    }

    // Crear convocatoria en Payload
    const convocation = await payload.create({
      collection: 'course-runs' as any,
      data: {
        course: parseInt(courseId),
        campus: campusId, // Validated campus ID
        start_date: fechaInicio,
        end_date: fechaFin,
        schedule_days: horario.map((e: ScheduleEntry) => e.day), // Array de días (english weekdays)
        schedule_time_start: earliestStart, // Earliest start time across all days
        schedule_time_end: latestEnd, // Latest end time across all days
        status: estado === 'abierta' ? 'enrollment_open' : 'draft' as any,
        min_students: 5, // Valor por defecto
        max_students: plazasTotales,
        current_enrollments: 0,
        price_override: precio > 0 ? precio : undefined,
        instructor_name: profesorId || undefined, // Stored as string for now
        notes: `Aula: ${aulaId || 'Sin asignar'}`, // Store aula in notes for now
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: convocation.id,
        courseId: course.id,
        courseName: course.name,
      },
      message: `Convocatoria creada exitosamente`,
    });
  } catch (error: any) {
    console.error('Error creating convocation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al crear convocatoria',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/convocatorias?courseId=X&campusId=Y
 *
 * Lista convocatorias de un curso o de un campus (o ambos)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const campusId = searchParams.get('campusId');

    if (!courseId && !campusId) {
      return NextResponse.json(
        { success: false, error: 'courseId o campusId requerido' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });

    // Build dynamic where clause
    const whereClause: any = {};

    if (courseId) {
      whereClause.course = { equals: parseInt(courseId) };
    }

    if (campusId) {
      whereClause.campus = { equals: parseInt(campusId) };
    }

    const convocations = await payload.find({
      collection: 'course-runs' as any,
      where: whereClause,
      limit: 100,
      sort: '-start_date',
      depth: 2, // Populate course and campus relationships
    });

    return NextResponse.json({
      success: true,
      data: convocations.docs.map((conv: any) => ({
        id: conv.id,
        cursoId: typeof conv.course === 'object' ? conv.course.id : conv.course,
        cursoNombre: typeof conv.course === 'object' ? conv.course.name : 'Curso',
        cursoTipo: typeof conv.course === 'object' ? conv.course.course_type : undefined,
        campusId: typeof conv.campus === 'object' ? conv.campus.id : conv.campus,
        campusNombre: typeof conv.campus === 'object' ? conv.campus.name : 'Sin sede',
        fechaInicio: conv.start_date,
        fechaFin: conv.end_date,
        horario: `${conv.schedule_days?.join(', ')} ${conv.schedule_time_start}-${conv.schedule_time_end}`,
        estado: conv.status,
        plazasTotales: conv.max_students,
        plazasOcupadas: conv.current_enrollments,
        precio: conv.price_override || 0,
        profesor: conv.instructor_name,
        modalidad: conv.modality || 'presencial',
      })),
      total: convocations.totalDocs,
    });
  } catch (error) {
    console.error('Error fetching convocations:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener convocatorias' },
      { status: 500 }
    );
  }
}

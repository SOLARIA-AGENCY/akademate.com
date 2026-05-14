'use client'

import { Globe2, Mail, Phone } from 'lucide-react'

export interface CoursePrintRun {
  id: string | number
  codigo?: string
  campusNombre?: string
  aulaNombre?: string
  fechaInicio?: string
  fechaFin?: string
  horario?: string
  turno?: string
  plazasTotales?: number
  plazasOcupadas?: number
  precio?: number
  estado?: string
}

export interface CoursePrintSheetProps {
  course: {
    id: string | number
    name?: string
    codigo?: string
    short_description?: string
    course_type?: string
    modality?: string
    area?: string
    duration_hours?: number
    base_price?: number | null
    featured_image?: unknown
    landing_objectives?: Array<{ text?: string }>
    landing_access_requirements?: string
    landing_outcomes?: string
    landing_program_blocks?: Array<{ title?: string; body?: string; items?: Array<{ text?: string }> }>
    dossier_pdf?: unknown
  }
  imageUrl?: string | null
  dossierUrl?: string | null
  areaName?: string | null
  courseTypeLabel: string
  modalityLabel: string
  publicCourseUrl: string
  qrUrl: string
  activeRuns: CoursePrintRun[]
  formatCurrency: (value?: number | null) => string
  formatDateRange: (start?: string, end?: string) => string
  logoUrl?: string
  contactPhone?: string
  contactEmail?: string
}

function textList(items?: Array<{ text?: string }>): string[] {
  return (items ?? []).map((item) => item.text?.trim()).filter((value): value is string => Boolean(value))
}

export function CoursePrintSheet({
  course,
  imageUrl,
  dossierUrl,
  areaName,
  courseTypeLabel,
  modalityLabel,
  publicCourseUrl,
  qrUrl,
  activeRuns,
  formatCurrency,
  formatDateRange,
  logoUrl = '/logos/cep-formacion-logo.png',
  contactPhone = '+34 922 533 533',
  contactEmail = 'info@cepformacion.com',
}: CoursePrintSheetProps) {
  const objectives = textList(course.landing_objectives).slice(0, 5)
  const programBlocks = (course.landing_program_blocks ?? []).slice(0, 4)
  const requirements = course.landing_access_requirements?.trim()
  const outcomes = course.landing_outcomes?.trim()
  const printRuns = activeRuns.slice(0, 3)

  return (
    <section id="course-print-sheet" className="hidden bg-white p-0 text-[10px] leading-snug text-slate-900">
      <div className="flex items-center justify-between border-b-[3px] border-[#f2014b] pb-3">
        <img src={logoUrl} alt="CEP Formacion" className="h-10 w-auto object-contain" />
        <div className="text-right">
          <p className="text-[16px] font-black uppercase tracking-wide">Ficha informativa de curso</p>
          <p className="text-[10px] text-slate-500">{course.codigo ?? `Curso ${course.id}`}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1.5fr_0.8fr] gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#f2014b]">{courseTypeLabel}</p>
          <h1 className="mt-1 text-[23px] font-black leading-[1.05]">{course.name ?? 'Curso sin nombre'}</h1>
          <p className="mt-2 line-clamp-4 text-[11px] leading-relaxed text-slate-700">
            {course.short_description || 'Información detallada disponible próximamente.'}
          </p>
        </div>
        {imageUrl ? (
          <img src={imageUrl} alt={course.name ?? 'Curso'} className="h-32 w-full rounded-md object-cover" />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            Imagen pendiente
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          ['Modalidad', modalityLabel],
          ['Duración', course.duration_hours ? `${course.duration_hours} horas` : 'Por definir'],
          ['Área', areaName ?? course.area ?? 'Por definir'],
          ['Precio', formatCurrency(course.base_price)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-200 p-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
            <p className="mt-1 line-clamp-2 font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-200 p-2.5">
          <h2 className="text-[12px] font-black">Objetivos</h2>
          {objectives.length > 0 ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {objectives.map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
          ) : (
            <p className="mt-1 text-slate-600">Objetivos disponibles próximamente.</p>
          )}
        </div>
        <div className="rounded-md border border-slate-200 p-2.5">
          <h2 className="text-[12px] font-black">Requisitos y salidas</h2>
          <p className="mt-1"><strong>Requisitos:</strong> {requirements || 'A consultar con admisiones.'}</p>
          <p className="mt-1"><strong>Salidas:</strong> {outcomes || 'A consultar con orientación académica.'}</p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-slate-200 p-2.5">
        <h2 className="text-[12px] font-black">Contenidos / programa</h2>
        {programBlocks.length > 0 ? (
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
            {programBlocks.map((block, index) => (
              <div key={`${block.title ?? 'bloque'}-${index}`}>
                <p className="font-bold">{block.title || `Bloque ${index + 1}`}</p>
                {block.body ? <p className="line-clamp-2 text-slate-700">{block.body}</p> : null}
                {block.items?.length ? (
                  <ul className="mt-0.5 list-disc pl-4 text-slate-700">
                    {block.items.slice(0, 3).map((item, itemIndex) => item.text ? <li key={`${item.text}-${itemIndex}`} className="line-clamp-1">{item.text}</li> : null)}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-slate-600">Programa disponible próximamente.</p>
        )}
        <p className="mt-1"><strong>PDF:</strong> {dossierUrl ? 'Dossier disponible en la ficha digital.' : 'PDF no disponible todavía.'}</p>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-black">Convocatorias</h2>
          <p className="text-[9px] text-slate-500">{activeRuns.length} convocatoria(s) activa(s) o planificada(s)</p>
        </div>
        {printRuns.length === 0 ? (
          <div className="mt-1 rounded-md border border-slate-200 p-2 text-slate-600">
            Consulte disponibilidad en recepción o en la web.
          </div>
        ) : (
          <table className="mt-1 w-full border-collapse overflow-hidden rounded-md text-left">
            <thead className="bg-slate-100 text-[8px] uppercase text-slate-600">
              <tr>
                <th className="border p-1.5">Código</th>
                <th className="border p-1.5">Sede / aula</th>
                <th className="border p-1.5">Fechas</th>
                <th className="border p-1.5">Horario</th>
                <th className="border p-1.5">Plazas</th>
                <th className="border p-1.5">Precio</th>
              </tr>
            </thead>
            <tbody>
              {printRuns.map((conv) => (
                <tr key={conv.id}>
                  <td className="border p-1.5 font-bold">{conv.codigo ?? conv.id}</td>
                  <td className="border p-1.5">{conv.campusNombre ?? 'Por definir'} / {conv.aulaNombre ?? 'Por definir'}</td>
                  <td className="border p-1.5">{formatDateRange(conv.fechaInicio, conv.fechaFin)}</td>
                  <td className="border p-1.5">{conv.horario?.trim() || conv.turno || 'Por definir'}</td>
                  <td className="border p-1.5">{conv.plazasOcupadas ?? 0}/{conv.plazasTotales ?? 0}</td>
                  <td className="border p-1.5">{formatCurrency(conv.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-4 border-t border-slate-200 pt-2.5">
        <div>
          <h2 className="text-[12px] font-black">Contacto</h2>
          <div className="mt-1 grid grid-cols-2 gap-1 text-[10px]">
            <p className="flex items-center gap-1"><Phone className="size-3 text-[#f2014b]" />{contactPhone}</p>
            <p className="flex items-center gap-1"><Mail className="size-3 text-[#f2014b]" />{contactEmail}</p>
            <p className="flex items-center gap-1"><Globe2 className="size-3 text-[#f2014b]" />cepformacion.akademate.com</p>
          </div>
          <p className="mt-2 text-[8px] leading-relaxed text-slate-500">
            Documento informativo. Fechas, plazas, precios y condiciones pueden estar sujetos a cambios hasta formalizar la matrícula.
          </p>
        </div>
        <div className="text-center">
          <img src={qrUrl} alt="QR web del curso" className="size-20" />
          <p className="mt-0.5 text-[8px] text-slate-500">Ver curso en la web</p>
        </div>
      </div>
    </section>
  )
}

import { ItemGroup } from '@payload-config/components/ui/item'
import { CourseDenseRow, type CourseDenseRowData } from './CourseDenseRow'

export type DenseCourseTypeKey = 'privados' | 'desempleados' | 'ocupados' | 'teleformacion' | 'otros'

const TYPE_ORDER: DenseCourseTypeKey[] = ['privados', 'ocupados', 'desempleados']

export const DENSE_TYPE_VISUALS: Record<DenseCourseTypeKey, { label: string; color: string }> = {
  privados: { label: 'Cursos privados', color: '#f2014b' },
  ocupados: { label: 'Cursos para ocupados', color: '#16a34a' },
  desempleados: { label: 'Cursos para desempleados', color: '#1d4ed8' },
  teleformacion: { label: 'Teleformación', color: '#F97316' },
  otros: { label: 'Otros', color: '#64748b' },
}

export function normalizeDenseTypeKey(typeLabel: string): DenseCourseTypeKey {
  const key = typeLabel
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (key.includes('privad')) return 'privados'
  if (key.includes('desemple')) return 'desempleados'
  if (key.includes('ocupad')) return 'ocupados'
  if (key.includes('teleform')) return 'teleformacion'
  if ((TYPE_ORDER as string[]).includes(key)) return key as DenseCourseTypeKey
  return 'otros'
}

export type DenseCourseGroup = {
  key: DenseCourseTypeKey
  label: string
  color: string
  courses: CourseDenseRowData[]
}

export function groupDenseCourses(courses: CourseDenseRowData[]): DenseCourseGroup[] {
  const buckets = new Map<DenseCourseTypeKey, CourseDenseRowData[]>()
  for (const course of courses) {
    const key = normalizeDenseTypeKey(course.typeLabel)
    const list = buckets.get(key) ?? []
    list.push(course)
    buckets.set(key, list)
  }

  return TYPE_ORDER.flatMap((key) => {
    const groupCourses = buckets.get(key)
    if (!groupCourses?.length) return []
    const visual = DENSE_TYPE_VISUALS[key]
    return [
      {
        key,
        label: visual.label,
        color: visual.color,
        courses: [...groupCourses].sort((a, b) => a.name.localeCompare(b.name, 'es')),
      },
    ]
  })
}

export function CourseDenseCatalog({ courses }: { courses: CourseDenseRowData[] }) {
  const groups = groupDenseCourses(courses)

  return (
    <div className="space-y-20">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`course-type-${group.key}`}>
          <h3
            id={`course-type-${group.key}`}
            className="text-2xl font-semibold tracking-tight text-slate-950"
          >
            {group.label}
          </h3>
          <ItemGroup className="mt-10 grid max-w-3xl grid-cols-1">
            {group.courses.map((course) => (
              <CourseDenseRow key={course.id} course={course} />
            ))}
          </ItemGroup>
        </section>
      ))}
    </div>
  )
}

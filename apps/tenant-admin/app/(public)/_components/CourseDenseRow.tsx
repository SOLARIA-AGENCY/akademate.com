import Link from 'next/link'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Item, ItemActions, ItemContent, ItemTitle } from '@payload-config/components/ui/item'
import { cn } from '@payload-config/lib/utils'
import { displayCourseTitle } from './course-title'

export type CourseDenseRowData = {
  id: string
  name: string
  typeLabel: string
  href: string
  enrollmentOpen: boolean
  enrollmentClosed?: boolean
}

const BADGE_SLOT_CLASS = 'flex h-5 w-[6.75rem] shrink-0 items-center justify-start sm:w-[8.5rem]'

function enrollmentBadgeColor(typeLabel: string): string {
  const key = typeLabel
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (key.includes('desemple')) return '#1d4ed8'
  if (key.includes('ocupad')) return '#16a34a'
  if (key.includes('teleform')) return '#f97316'
  return '#f2014b'
}

export function CourseDenseRow({ course }: { course: CourseDenseRowData }) {
  return (
    <Item
      asChild
      variant="default"
      size="sm"
      className={cn(
        'min-h-12 w-full min-w-0 rounded-xl border-0 border-b border-border px-2 py-3',
        course.enrollmentOpen && !course.enrollmentClosed && 'bg-[#ecfdf5]',
      )}
    >
      <Link href={course.href} className="text-inherit no-underline">
        <ItemContent className="min-w-0 flex-1 flex-row items-center overflow-hidden">
          <ItemTitle className="block min-w-0 flex-1 whitespace-normal font-medium leading-snug text-slate-950 normal-case">
            {displayCourseTitle(course.name)}
          </ItemTitle>
        </ItemContent>
        <ItemActions className="shrink-0 gap-2 pl-3">
          <span className={cn(BADGE_SLOT_CLASS)} data-slot="enrollment-badge-slot">
            {course.enrollmentClosed ? (
              <Badge
                className="max-w-full truncate rounded-full border-transparent px-3 font-semibold text-white"
                style={{ backgroundColor: '#64748b' }}
              >
                Matrícula cerrada
              </Badge>
            ) : course.enrollmentOpen ? (
              <Badge
                className="max-w-full truncate rounded-full border-transparent px-3 font-semibold text-white"
                style={{ backgroundColor: enrollmentBadgeColor(course.typeLabel) }}
              >
                Matrícula abierta
              </Badge>
            ) : null}
          </span>
          <Button
            asChild
            size="sm"
            className="pointer-events-none h-8 shrink-0 rounded-full bg-[#f2014b] px-4 text-xs font-black text-white shadow-none hover:bg-[#d0013f]"
          >
            <span>Ver curso →</span>
          </Button>
        </ItemActions>
      </Link>
    </Item>
  )
}

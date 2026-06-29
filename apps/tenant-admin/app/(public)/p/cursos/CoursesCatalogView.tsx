'use client'

import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { PublishedCourse, StudyTypeVisualMeta } from '@/app/lib/server/published-courses'
import { CoursePublicCard, CoursePublicListItem } from '@payload-config/components/akademate/public'
import { Button } from '@payload-config/components/ui/button'

export type CourseGroup = {
  key: string
  label: string
  description: string
  courses: PublishedCourse[]
}

type CoursesCatalogViewProps = {
  groups: CourseGroup[]
  visualMap: Record<string, StudyTypeVisualMeta>
  fallbackColor: string
  defaultViewMode?: 'grid' | 'list'
  hideViewToggle?: boolean
  compactListItems?: boolean
}

export function CoursesCatalogView({
  groups,
  visualMap: _visualMap,
  fallbackColor: _fallbackColor,
  defaultViewMode = 'list',
  hideViewToggle = false,
  compactListItems = false,
}: CoursesCatalogViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode)
  const [queries, setQueries] = useState<Record<string, string>>({})

  return (
    <div>
      {!hideViewToggle ? (
        <div className="mb-8 flex justify-end">
          <div className="inline-flex w-fit rounded-full bg-slate-100 p-1">
            <Button
              type="button"
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              aria-label="Vista en cuadrícula"
              title="Vista en cuadrícula"
              className={`h-9 w-9 rounded-full p-0 font-black ${viewMode === 'grid' ? 'bg-[#f2014b] text-white hover:bg-[#d0013f]' : 'text-slate-700 hover:bg-white'}`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              aria-label="Vista de lista"
              title="Vista de lista"
              className={`h-9 w-9 rounded-full p-0 font-black ${viewMode === 'list' ? 'bg-[#f2014b] text-white hover:bg-[#d0013f]' : 'text-slate-700 hover:bg-white'}`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-14">
        {groups.map((group) => {
          const query = queries[group.key]?.trim().toLowerCase() ?? ''
          const visibleCourses = query
            ? group.courses.filter((course) => {
                const haystack = `${course.nombre} ${course.area ?? ''} ${course.codigo ?? ''}`.toLowerCase()
                return haystack.includes(query)
              })
            : group.courses

          return (
          <section key={group.key} id={group.key} className="scroll-mt-28">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">
                  {group.courses.length} formaciones
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {group.label}
                </h2>
                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                  {group.description}
                </p>
              </div>
            </div>
            <label className="mb-4 block">
              <span className="sr-only">Buscar en {group.label}</span>
              <input
                type="search"
                value={queries[group.key] ?? ''}
                onChange={(event) => setQueries((current) => ({ ...current, [group.key]: event.target.value }))}
                placeholder={`Buscar en ${group.label.toLowerCase()}...`}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-rose-200 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 sm:max-w-md"
              />
            </label>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {visibleCourses.map((course) => (
                  <CoursePublicCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="grid gap-5">
                {visibleCourses.map((course) => (
                  <CoursePublicListItem
                    key={course.id}
                    course={course}
                    compact={compactListItems}
                  />
                ))}
              </div>
            )}
            {visibleCourses.length === 0 ? (
              <p className="mt-4 rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                No hay cursos que coincidan con la búsqueda en esta sección.
              </p>
            ) : null}
          </section>
        )})}
      </div>
    </div>
  )
}

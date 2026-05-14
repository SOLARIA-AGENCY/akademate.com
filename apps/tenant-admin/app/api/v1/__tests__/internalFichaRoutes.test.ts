import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8')
}

describe('Dashboard fichas internas', () => {
  it('defines complete internal ficha routes for courses, cycles and convocatorias', () => {
    expect(existsSync(join(root, 'app/(app)/(dashboard)/cursos/[id]/ficha/page.tsx'))).toBe(true)
    expect(existsSync(join(root, 'app/(app)/(dashboard)/ciclos/[id]/ficha/page.tsx'))).toBe(true)
    expect(existsSync(join(root, 'app/(app)/(dashboard)/programacion/[id]/ficha/page.tsx'))).toBe(true)
  })

  it('course detail navigates to the complete course ficha instead of opening a modal', () => {
    const source = read('app/(app)/(dashboard)/cursos/[id]/page.tsx')
    expect(source).toContain('Imprimir curso')
    expect(source).toContain('Ver curso')
    expect(source).toContain('router.push(`/dashboard/cursos/${id}/ficha`)')
    expect(source).not.toContain('setFullSheetOpen(true)')
  })

  it('cycle and run detail pages expose print actions to their ficha pages', () => {
    const cycleSource = read('app/(app)/(dashboard)/ciclos/[id]/page.tsx')
    const runSource = read('app/(app)/(dashboard)/programacion/[id]/page.tsx')

    expect(cycleSource).toContain('Imprimir ciclo')
    expect(cycleSource).toContain('router.push(`/dashboard/ciclos/${id}/ficha`)')
    expect(runSource).toContain('Imprimir convocatoria')
    expect(runSource).toContain('router.push(`/dashboard/programacion/${id}/ficha`)')
  })

  it('ficha pages include PDF fallbacks and print actions', () => {
    const courseFicha = read('app/(app)/(dashboard)/cursos/[id]/ficha/page.tsx')
    const cycleFicha = read('app/(app)/(dashboard)/ciclos/[id]/ficha/page.tsx')
    const runFicha = read('app/(app)/(dashboard)/programacion/[id]/ficha/page.tsx')

    expect(courseFicha).toContain('PDF del programa no disponible todavía.')
    expect(cycleFicha).toContain('PDF del programa no disponible todavía.')
    expect(runFicha).toContain('PDF del programa no disponible todavía.')
    expect(courseFicha).toContain('window.print()')
    expect(cycleFicha).toContain('window.print()')
    expect(runFicha).toContain('window.print()')
  })

  it('course cards keep stable covered images and visible red buttons', () => {
    const cardSource = read('@payload-config/components/ui/CourseTemplateCard.tsx')
    const listSource = read('@payload-config/components/ui/CourseListItem.tsx')

    expect(cardSource).toContain('object-cover')
    expect(cardSource).toContain('min-h-[230px]')
    expect(cardSource).toContain('bg-[#f2014b]')
    expect(cardSource).toContain('hover:text-white')
    expect(listSource).toContain('bg-[#f2014b]')
    expect(listSource).toContain('hover:text-white')
  })

  it('cycle detail resolves active Meta campaigns before rendering campaign badges', () => {
    const cycleSource = read('app/(app)/(dashboard)/ciclos/[id]/page.tsx')

    expect(cycleSource).toContain("fetch('/api/meta/campaigns?limit=100&sort=updated_time&order=desc'")
    expect(cycleSource).toContain('campaignMatchesCycleRun')
    expect(cycleSource).toContain('campaignStatus: active ?')
    expect(cycleSource).toContain('status={normalizeCampaignStatus(conv.campaignStatus')
  })
})

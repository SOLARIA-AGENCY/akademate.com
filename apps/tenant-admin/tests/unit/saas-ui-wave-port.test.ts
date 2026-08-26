import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8')
}

describe('saas ui wave port', () => {
  it('layout uses the right AI agent rail instead of the chat FAB', () => {
    const layout = read('app/(app)/(dashboard)/layout.tsx')
    expect(layout).toContain('DashboardAgentRail')
    expect(layout).not.toContain('ChatbotWidget')
  })

  it('directory thead stays opaque white and avatars have a photo fallback', () => {
    const directory = read(
      '@payload-config/components/akademate/dashboard/directory/PremiumDirectoryShell.tsx',
    )
    expect(directory).toContain('[&_th]:bg-white')
    expect(directory).toContain('fallbackSrc = AKADEMATE_ACADEMIC_FALLBACK_IMAGE')
    expect(directory).toContain('Filas por página')
  })

  it('course ficha shows a convocatorias calendar', () => {
    const source = read('app/(app)/(dashboard)/cursos/[id]/page.tsx')
    expect(source).toContain('CampusCourseCalendar')
    expect(source).toContain('title="Calendario de convocatorias"')
  })

  it('planner hides convocatorias that do not run that day', () => {
    const matrix = read('app/(app)/(dashboard)/planner/OccupancyMatrix.tsx')
    expect(matrix).toContain('occupancyCards = shiftCards.filter((card) => cardMatchesDay(card, selectedDay))')
    expect(matrix).not.toContain('opacity-40 saturate-50')
  })
})

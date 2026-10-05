import { describe, expect, it } from 'vitest'
import {
  collectOpenRunsByCycle,
  cycleFacts,
  cycleHoursLabel,
  cycleLevelMeta,
  toCycleCardModel,
} from '../../app/(public)/_components/cycle-display'

describe('cycle display', () => {
  it('uses CEP colors and does not invent hours, codes or FSE copy', () => {
    expect(cycleLevelMeta('grado_medio')).toEqual({ label: 'Grado medio', bgColor: '#3E091A' })
    expect(cycleLevelMeta('grado_superior')).toEqual({ label: 'Grado superior', bgColor: '#f2014b' })

    const facts = cycleFacts(
      toCycleCardModel(
        {
          name: 'Farmacia y Parafarmacia',
          slug: 'cfgm-farmacia-parafarmacia',
          level: 'grado_medio',
          family: 'Sanidad',
          officialTitle: 'Técnico en Farmacia y Parafarmacia',
          duration: { modality: 'semipresencial', practiceHours: 370, classFrequency: 'Viernes' },
        },
        null,
      ),
    )

    expect(facts.map((fact) => fact.label)).toEqual(['Titulación', 'Modalidad', 'Prácticas', 'Familia'])
    expect(facts.find((fact) => fact.label === 'Prácticas')?.value).toBe('370 h en empresa')
    expect(JSON.stringify(facts)).not.toContain('500')
    expect(JSON.stringify(facts)).not.toContain('SANMS')
    expect(JSON.stringify(facts)).not.toContain('FSE')
    expect(cycleHoursLabel({ name: 'x', slug: 'x', imageUrl: null })).toBeNull()
  })

  it('uses official campus names without the word Sede', () => {
    const runs = collectOpenRunsByCycle(
      [
        {
          id: '1',
          codigo: 'SC-2026-001',
          start_date: '2026-09-21',
          cycle: { id: 'ciclo-1' },
          campus: { name: 'Sede Santa Cruz' },
        },
      ],
      ['ciclo-1'],
    )
    expect(runs.get('ciclo-1')?.[0]?.campusName).toBe('CEP Santa Cruz')
  })
})

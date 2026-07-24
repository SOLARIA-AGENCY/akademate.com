import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  OpenConvocationsCarouselClient,
  type OpenConvocationCard,
} from '@/app/(public)/_components/OpenConvocationsCarouselClient'

function card(id: string): OpenConvocationCard {
  return {
    id,
    href: `/convocatorias/${id}`,
    title: `Curso ${id}`,
    imageUrl: null,
    badge: null,
    enrollmentLabel: 'Matrícula abierta',
    startDateLabel: '01 ago 2026',
    campusLabel: 'Sede Santa Cruz',
    scheduleLabel: 'lunes · 10:00-14:00',
    priceLabel: 'Consultar',
    areaColor: '#f2014b',
  }
}

describe('open convocations carousel', () => {
  it('renders every card in one responsive 1/2/3-column scroll track', () => {
    const html = renderToStaticMarkup(
      <OpenConvocationsCarouselClient
        cards={[card('a'), card('b'), card('c'), card('d')]}
        brandColor="#f2014b"
      />
    )

    expect((html.match(/href="\/convocatorias\//g) ?? []).length).toBe(4)
    expect(html).toContain('basis-full')
    expect(html).toContain('md:basis-[calc((100%_-_1.5rem)/2)]')
    expect(html).toContain('xl:basis-[calc((100%_-_3rem)/3)]')
    expect(html).toContain('aria-label="Ver convocatorias anteriores"')
    expect(html).toContain('aria-label="Ver más convocatorias"')
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AreaPublicCard } from '../../@payload-config/components/akademate/public/PublicEntityCards'

describe('AreaPublicCard', () => {
  it('reserves three visible lines for long training area names', () => {
    render(
      <AreaPublicCard
        title="Área de Actividades Físicas Deportivas y Entrenamiento Personal"
        href="/p/areas/actividad-fisica"
        imageUrl="/website/cep/categories/actividad-fisica.jpg"
      />,
    )

    const heading = screen.getByRole('heading', {
      name: 'de Actividades Físicas Deportivas y Entrenamiento Personal',
    })
    expect(heading).toHaveClass('line-clamp-3', 'min-h-[4.75rem]')
    expect(heading).not.toHaveClass('line-clamp-2')
  })
})

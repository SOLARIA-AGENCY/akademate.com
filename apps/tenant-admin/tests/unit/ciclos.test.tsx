import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import TodosLosCiclosPage from '../../app/(dashboard)/ciclos/page'

describe('Todos los Ciclos Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title and description', () => {
    render(<TodosLosCiclosPage data-oid="9yhlnr:" />)
    expect(screen.getByText('Todos los Ciclos Formativos')).toBeInTheDocument()
    expect(
      screen.getByText('Gestión completa de ciclos de Grado Medio y Grado Superior')
    ).toBeInTheDocument()
  })

  it('displays correct stats cards', () => {
    render(<TodosLosCiclosPage data-oid="dar95tp" />)

    // Check for all 6 stat cards
    expect(screen.getByText('Total Ciclos')).toBeInTheDocument()
    expect(screen.getAllByText('10')[0]).toBeInTheDocument() // Total ciclos count
    expect(screen.getAllByText('Grado Medio')[0]).toBeInTheDocument()
    expect(screen.getAllByText('4')[0]).toBeInTheDocument() // Grado Medio count
    expect(screen.getAllByText('Grado Superior')[0]).toBeInTheDocument()
    expect(screen.getAllByText('6')[0]).toBeInTheDocument() // Grado Superior count
  })

  it('renders all 10 ciclos cards', () => {
    render(<TodosLosCiclosPage data-oid="igs-2gi" />)

    // Check for Grado Medio ciclos
    expect(screen.getByText('Gestión Administrativa')).toBeInTheDocument()
    expect(screen.getByText('Sistemas Microinformáticos y Redes')).toBeInTheDocument()
    expect(screen.getByText('Actividades Comerciales')).toBeInTheDocument()
    expect(screen.getByText('Gestión de Alojamientos Turísticos')).toBeInTheDocument()

    // Check for Grado Superior ciclos
    expect(screen.getByText('Desarrollo de Aplicaciones Web')).toBeInTheDocument()
    expect(screen.getByText('Administración y Finanzas')).toBeInTheDocument()
    expect(screen.getByText('Marketing y Publicidad')).toBeInTheDocument()
    expect(screen.getByText('Diseño y Edición de Publicaciones')).toBeInTheDocument()
    expect(screen.getByText('Guía, Información y Asistencias Turísticas')).toBeInTheDocument()
    expect(screen.getByText('Producción de Audiovisuales y Espectáculos')).toBeInTheDocument()
  })

  it('displays corporate color #ff2014 on cards', () => {
    const { container } = render(<TodosLosCiclosPage data-oid="0_d_ruo" />)
    const cards = container.querySelectorAll('.border-2')
    expect(cards.length).toBe(10) // All 10 ciclos should have border-2 class
  })

  it('filters ciclos by search term', async () => {
    const user = userEvent.setup()
    render(<TodosLosCiclosPage data-oid="079_wp2" />)

    const searchInput = screen.getByPlaceholderText('Buscar ciclos...')
    await user.type(searchInput, 'Desarrollo')

    // Should show only DAW
    expect(screen.getByText('Desarrollo de Aplicaciones Web')).toBeInTheDocument()
    expect(screen.queryByText('Gestión Administrativa')).not.toBeInTheDocument()
  })

  it('filters ciclos by nivel (Grado Medio)', async () => {
    const user = userEvent.setup()
    render(<TodosLosCiclosPage data-oid="dyqiqi6" />)

    // Open nivel select and choose Grado Medio
    const nivelSelect = screen.getAllByRole('combobox')[1] // Second select is nivel
    await user.click(nivelSelect)

    await waitFor(() => {
      const gradoMedioOption = screen.getByRole('option', { name: /Grado Medio/i })
      user.click(gradoMedioOption)
    })

    // Should show 4 Grado Medio ciclos
    expect(screen.getByText('Mostrando 4 de 10 ciclos formativos')).toBeInTheDocument()
  })

  it('filters ciclos by familia profesional', async () => {
    const user = userEvent.setup()
    render(<TodosLosCiclosPage data-oid="m-pu17b" />)

    const familiaSelect = screen.getAllByRole('combobox')[2] // Third select is familia
    await user.click(familiaSelect)

    await waitFor(() => {
      const informaticaOption = screen.getByRole('option', {
        name: /Informática y Comunicaciones/i,
      })
      user.click(informaticaOption)
    })

    // Should show only informática ciclos
    expect(screen.getByText('Sistemas Microinformáticos y Redes')).toBeInTheDocument()
    expect(screen.getByText('Desarrollo de Aplicaciones Web')).toBeInTheDocument()
  })

  it('displays ocupación bars with correct colors', () => {
    const { container } = render(<TodosLosCiclosPage data-oid="00h.9cb" />)

    // Check for ocupación percentage labels
    const ocupacionLabels = screen.getAllByText('Ocupación')
    expect(ocupacionLabels.length).toBe(10) // One for each ciclo

    // Check for ocupación bars container
    const ocupacionContainers = container.querySelectorAll('.h-2')
    expect(ocupacionContainers.length).toBeGreaterThan(0)
  })

  it('navigates to correct detail page on card click', async () => {
    const user = userEvent.setup()
    const { mockRouter } = await import('../utils/test-utils')

    render(<TodosLosCiclosPage data-oid="1gm6pr0" />)

    // Click on a Grado Medio ciclo
    const gestCard = screen.getByText('Gestión Administrativa').closest('.cursor-pointer')
    await user.click(gestCard!)

    expect(mockRouter.push).toHaveBeenCalledWith('/ciclos-medio#cfgm-gestion-administrativa')
  })

  it('clears all filters when "Limpiar filtros" is clicked', async () => {
    const user = userEvent.setup()
    render(<TodosLosCiclosPage data-oid="1l7b2d1" />)

    // Apply some filters
    const searchInput = screen.getByPlaceholderText('Buscar ciclos...')
    await user.type(searchInput, 'Desarrollo')

    expect(screen.queryByText('Gestión Administrativa')).not.toBeInTheDocument()

    // Clear filters
    const clearButton = screen.getByText('Limpiar filtros')
    await user.click(clearButton)

    // All ciclos should be visible again
    expect(screen.getByText('Mostrando 10 de 10 ciclos formativos')).toBeInTheDocument()
  })

  it('shows empty state when no ciclos match filters', async () => {
    const user = userEvent.setup()
    render(<TodosLosCiclosPage data-oid="myw-89t" />)

    const searchInput = screen.getByPlaceholderText('Buscar ciclos...')
    await user.type(searchInput, 'NonExistentCiclo')

    expect(screen.getByText('No se encontraron ciclos')).toBeInTheDocument()
    expect(screen.getByText('Intenta ajustar los filtros de búsqueda')).toBeInTheDocument()
  })

  it('displays "Nuevo Ciclo Formativo" button', () => {
    render(<TodosLosCiclosPage data-oid="a93a469" />)
    expect(screen.getByText('Nuevo Ciclo Formativo')).toBeInTheDocument()
  })
})

describe('Ciclos Medio Page', () => {
  it('redirects mock CFGM surface to the live ciclos listing', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/(app)/(dashboard)/ciclos-medio/page.tsx'),
      'utf8',
    )
    expect(source).toContain("redirect('/dashboard/ciclos')")
    expect(source).not.toContain('unsplash')
  })
})

describe('Ciclos Superior Page', () => {
  it('redirects mock CFGS surface to the live ciclos listing', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/(app)/(dashboard)/ciclos-superior/page.tsx'),
      'utf8',
    )
    expect(source).toContain("redirect('/dashboard/ciclos')")
    expect(source).not.toContain('unsplash')
  })
})

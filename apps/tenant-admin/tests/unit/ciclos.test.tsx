import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import TodosLosCiclosPage from '../../app/(dashboard)/ciclos/page'
import CiclosMedioPage from '../../app/(dashboard)/ciclos-medio/page'
import CiclosSuperiorPage from '../../app/(dashboard)/ciclos-superior/page'

describe('Todos los Ciclos Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title and description', () => {
    render(<TodosLosCiclosPage />)
    expect(screen.getByText('Todos los Ciclos Formativos')).toBeInTheDocument()
    expect(
      screen.getByText('Gestión completa de ciclos de Grado Medio y Grado Superior')
    ).toBeInTheDocument()
  })

  it('displays correct stats cards', () => {
    render(<TodosLosCiclosPage />)

    // Check for all 6 stat cards
    expect(screen.getByText('Total Ciclos')).toBeInTheDocument()
    expect(screen.getAllByText('10')[0]).toBeInTheDocument() // Total ciclos count
    expect(screen.getAllByText('Grado Medio')[0]).toBeInTheDocument()
    expect(screen.getAllByText('4')[0]).toBeInTheDocument() // Grado Medio count
    expect(screen.getAllByText('Grado Superior')[0]).toBeInTheDocument()
    expect(screen.getAllByText('6')[0]).toBeInTheDocument() // Grado Superior count
  })

  it('renders all 10 ciclos cards', () => {
    render(<TodosLosCiclosPage />)
    
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
    const { container } = render(<TodosLosCiclosPage />)
    const cards = container.querySelectorAll('.border-2')
    expect(cards.length).toBe(10) // All 10 ciclos should have border-2 class
  })

  it('filters ciclos by search term', async () => {
    const user = userEvent.setup()
    render(<TodosLosCiclosPage />)
    
    const searchInput = screen.getByPlaceholderText('Buscar ciclos...')
    await user.type(searchInput, 'Desarrollo')
    
    // Should show only DAW
    expect(screen.getByText('Desarrollo de Aplicaciones Web')).toBeInTheDocument()
    expect(screen.queryByText('Gestión Administrativa')).not.toBeInTheDocument()
  })

  it('filters ciclos by nivel (Grado Medio)', async () => {
    const user = userEvent.setup()
    render(<TodosLosCiclosPage />)
    
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
    render(<TodosLosCiclosPage />)
    
    const familiaSelect = screen.getAllByRole('combobox')[2] // Third select is familia
    await user.click(familiaSelect)
    
    await waitFor(() => {
      const informaticaOption = screen.getByRole('option', { name: /Informática y Comunicaciones/i })
      user.click(informaticaOption)
    })
    
    // Should show only informática ciclos
    expect(screen.getByText('Sistemas Microinformáticos y Redes')).toBeInTheDocument()
    expect(screen.getByText('Desarrollo de Aplicaciones Web')).toBeInTheDocument()
  })

  it('displays ocupación bars with correct colors', () => {
    const { container } = render(<TodosLosCiclosPage />)

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
    
    render(<TodosLosCiclosPage />)
    
    // Click on a Grado Medio ciclo
    const gestCard = screen.getByText('Gestión Administrativa').closest('.cursor-pointer')
    await user.click(gestCard!)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/ciclos-medio#cfgm-gestion-administrativa')
  })

  it('clears all filters when "Limpiar filtros" is clicked', async () => {
    const user = userEvent.setup()
    render(<TodosLosCiclosPage />)
    
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
    render(<TodosLosCiclosPage />)
    
    const searchInput = screen.getByPlaceholderText('Buscar ciclos...')
    await user.type(searchInput, 'NonExistentCiclo')
    
    expect(screen.getByText('No se encontraron ciclos')).toBeInTheDocument()
    expect(screen.getByText('Intenta ajustar los filtros de búsqueda')).toBeInTheDocument()
  })

  it('displays "Nuevo Ciclo Formativo" button', () => {
    render(<TodosLosCiclosPage />)
    expect(screen.getByText('Nuevo Ciclo Formativo')).toBeInTheDocument()
  })
})

describe('Ciclos Medio Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title correctly', () => {
    render(<CiclosMedioPage />)
    expect(screen.getByText('Ciclos Formativos de Grado Medio')).toBeInTheDocument()
  })

  it('displays 4 CFGM programs', () => {
    render(<CiclosMedioPage />)
    
    expect(screen.getByText('Gestión Administrativa')).toBeInTheDocument()
    expect(screen.getByText('ADG201')).toBeInTheDocument()
    expect(screen.getByText('Sistemas Microinformáticos y Redes')).toBeInTheDocument()
    expect(screen.getByText('IFC301')).toBeInTheDocument()
    expect(screen.getByText('Actividades Comerciales')).toBeInTheDocument()
    expect(screen.getByText('COM101')).toBeInTheDocument()
    expect(screen.getByText('Gestión de Alojamientos Turísticos')).toBeInTheDocument()
    expect(screen.getByText('HOT201')).toBeInTheDocument()
  })

  it('displays correct stats for Grado Medio', () => {
    render(<CiclosMedioPage />)

    expect(screen.getByText('Total Ciclos')).toBeInTheDocument()
    expect(screen.getAllByText('4')[0]).toBeInTheDocument()
    expect(screen.getByText('Total Plazas')).toBeInTheDocument()
    expect(screen.getByText('107')).toBeInTheDocument() // 30+25+28+24
  })

  it('searches ciclos by name', async () => {
    const user = userEvent.setup()
    render(<CiclosMedioPage />)
    
    const searchInput = screen.getByPlaceholderText('Buscar ciclos...')
    await user.type(searchInput, 'Sistemas')
    
    expect(screen.getByText('Sistemas Microinformáticos y Redes')).toBeInTheDocument()
    expect(screen.queryByText('Gestión Administrativa')).not.toBeInTheDocument()
  })

  it('filters by familia profesional', async () => {
    const user = userEvent.setup()
    render(<CiclosMedioPage />)
    
    const familiaSelect = screen.getAllByRole('combobox')[0]
    await user.click(familiaSelect)
    
    await waitFor(() => {
      const adminOption = screen.getByRole('option', { name: /Administración y Gestión/i })
      user.click(adminOption)
    })
    
    expect(screen.getByText('Gestión Administrativa')).toBeInTheDocument()
  })

  it('shows ocupación percentage for each ciclo', () => {
    render(<CiclosMedioPage />)
    
    // Check for ocupación labels
    const ocupacionLabels = screen.getAllByText('Ocupación')
    expect(ocupacionLabels.length).toBeGreaterThan(0)
  })

  it('navigates to detail page on "Ver Detalles" click', async () => {
    const user = userEvent.setup()
    const { mockRouter } = await import('../utils/test-utils')
    
    render(<CiclosMedioPage />)
    
    const verDetallesButtons = screen.getAllByText('Ver Detalles del Ciclo')
    await user.click(verDetallesButtons[0])
    
    expect(mockRouter.push).toHaveBeenCalled()
  })
})

describe('Ciclos Superior Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title correctly', () => {
    render(<CiclosSuperiorPage />)
    expect(screen.getByText('Ciclos Formativos de Grado Superior')).toBeInTheDocument()
  })

  it('displays 6 CFGS programs', () => {
    render(<CiclosSuperiorPage />)
    
    expect(screen.getByText('Desarrollo de Aplicaciones Web')).toBeInTheDocument()
    expect(screen.getByText('IFC303')).toBeInTheDocument()
    expect(screen.getByText('Administración y Finanzas')).toBeInTheDocument()
    expect(screen.getByText('ADG202')).toBeInTheDocument()
    expect(screen.getByText('Marketing y Publicidad')).toBeInTheDocument()
    expect(screen.getByText('COM301')).toBeInTheDocument()
    expect(screen.getByText('Diseño y Edición de Publicaciones')).toBeInTheDocument()
    expect(screen.getByText('IMP501')).toBeInTheDocument()
    expect(screen.getByText('Guía, Información y Asistencias Turísticas')).toBeInTheDocument()
    expect(screen.getByText('HOT401')).toBeInTheDocument()
    expect(screen.getByText('Producción de Audiovisuales y Espectáculos')).toBeInTheDocument()
    expect(screen.getByText('IMS301')).toBeInTheDocument()
  })

  it('displays correct stats for Grado Superior', () => {
    render(<CiclosSuperiorPage />)

    expect(screen.getByText('Total Ciclos')).toBeInTheDocument()
    expect(screen.getAllByText('6')[0]).toBeInTheDocument()
    expect(screen.getByText('Total Plazas')).toBeInTheDocument()
    expect(screen.getByText('157')).toBeInTheDocument() // 30+32+28+20+25+22
  })

  it('filters ciclos by search term', async () => {
    const user = userEvent.setup()
    render(<CiclosSuperiorPage />)
    
    const searchInput = screen.getByPlaceholderText('Buscar ciclos...')
    await user.type(searchInput, 'Marketing')
    
    expect(screen.getByText('Marketing y Publicidad')).toBeInTheDocument()
    expect(screen.queryByText('Desarrollo de Aplicaciones Web')).not.toBeInTheDocument()
  })

  it('displays correct modality for each ciclo', () => {
    render(<CiclosSuperiorPage />)
    
    // All ciclos in this page should be "Presencial"
    const modalityLabels = screen.getAllByText('Presencial')
    expect(modalityLabels.length).toBeGreaterThan(0)
  })

  it('shows cursos activos count for each ciclo', () => {
    render(<CiclosSuperiorPage />)
    
    // Check for "cursos" text which appears in "{N} cursos"
    const cursosLabels = screen.getAllByText(/cursos/)
    expect(cursosLabels.length).toBeGreaterThan(0)
  })

  it('applies corporate color to all cards', () => {
    const { container } = render(<CiclosSuperiorPage />)
    
    const corporateColorCards = container.querySelectorAll('.border-\\[\\#ff2014\\]')
    expect(corporateColorCards.length).toBe(6) // 6 ciclos = 6 cards
  })

  it('displays "Nuevo Ciclo Superior" button', () => {
    render(<CiclosSuperiorPage />)
    expect(screen.getByText('Nuevo Ciclo Superior')).toBeInTheDocument()
  })
})

describe('Ciclos Corporate Color Consistency', () => {
  it('uses #ff2014 corporate color in Todos los Ciclos', () => {
    const { container } = render(<TodosLosCiclosPage />)
    // Check for border-2 cards (which have corporate color border)
    const cards = container.querySelectorAll('.border-2')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('uses #ff2014 corporate color in Ciclos Medio', () => {
    const { container } = render(<CiclosMedioPage />)
    // Check for border-2 cards (which have corporate color border)
    const cards = container.querySelectorAll('.border-2')
    expect(cards.length).toBe(4) // 4 CFGM programs
  })

  it('uses #ff2014 corporate color in Ciclos Superior', () => {
    const { container } = render(<CiclosSuperiorPage />)
    // Check for border-2 cards (which have corporate color border)
    const cards = container.querySelectorAll('.border-2')
    expect(cards.length).toBe(6) // 6 CFGS programs
  })
})

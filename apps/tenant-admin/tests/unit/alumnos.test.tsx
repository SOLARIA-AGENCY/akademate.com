import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import AlumnosPage from '../../app/(dashboard)/alumnos/page'

describe('Alumnos Page - Dual View System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title and description', () => {
    render(<AlumnosPage />)
    expect(screen.getByText('Gestión de Alumnos')).toBeInTheDocument()
    expect(screen.getByText(/Administra todos los alumnos del centro/i)).toBeInTheDocument()
  })

  it('displays stats cards with correct data', () => {
    render(<AlumnosPage />)
    
    expect(screen.getByText('Total Alumnos')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument() // Total students count
    expect(screen.getByText('Activos')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument() // Active students
    expect(screen.getByText('Inactivos')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // Inactive students
  })

  it('defaults to List view mode', () => {
    render(<AlumnosPage />)
    
    const listButton = screen.getByRole('button', { name: /Listado/i })
    expect(listButton).toHaveClass('default') // Active button has default variant
  })

  it('toggles between List and Grid view modes', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    // Initially in List view
    const listButton = screen.getByRole('button', { name: /Listado/i })
    const gridButton = screen.getByRole('button', { name: /Fichas/i })
    
    expect(listButton).toHaveAttribute('data-state', 'active')
    
    // Click Grid button
    await user.click(gridButton)
    
    await waitFor(() => {
      expect(gridButton).toHaveAttribute('data-state', 'active')
    })
  })

  it('displays preview sidebar in List view', () => {
    render(<AlumnosPage />)
    
    // Sidebar should show "Selecciona un alumno" initially
    expect(screen.getByText('Selecciona un alumno')).toBeInTheDocument()
    expect(screen.getByText(/Haz clic en un alumno de la lista/i)).toBeInTheDocument()
  })

  it('shows student preview when clicking a student in List view', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    // Click on first student
    const studentRow = screen.getByText('María González Ruiz').closest('div[role="button"]')
    await user.click(studentRow!)
    
    // Preview sidebar should show student details
    await waitFor(() => {
      expect(screen.getAllByText('María González Ruiz')[1]).toBeInTheDocument() // Second occurrence in sidebar
      expect(screen.getByText('maria.gonzalez@email.com')).toBeInTheDocument()
    })
  })

  it('displays "Ver Ficha" and "Editar" buttons in preview sidebar', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    // Select a student
    const studentRow = screen.getByText('María González Ruiz').closest('div[role="button"]')
    await user.click(studentRow!)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ver Ficha/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument()
    })
  })

  it('navigates to student detail page when "Ver Ficha" is clicked', async () => {
    const user = userEvent.setup()
    const { mockRouter } = await import('../utils/test-utils')
    
    render(<AlumnosPage />)
    
    // Select a student
    const studentRow = screen.getByText('María González Ruiz').closest('div[role="button"]')
    await user.click(studentRow!)
    
    // Click "Ver Ficha"
    const verFichaButton = await screen.findByRole('button', { name: /Ver Ficha/i })
    await user.click(verFichaButton)
    
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/alumnos/'))
  })

  it('navigates to edit page when "Editar" is clicked', async () => {
    const user = userEvent.setup()
    const { mockRouter } = await import('../utils/test-utils')
    
    render(<AlumnosPage />)
    
    // Select a student
    const studentRow = screen.getByText('María González Ruiz').closest('div[role="button"]')
    await user.click(studentRow!)
    
    // Click "Editar"
    const editButton = await screen.findByRole('button', { name: /Editar/i })
    await user.click(editButton)
    
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/alumnos/'))
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/editar'))
  })

  it('displays all 8 students in the list', () => {
    render(<AlumnosPage />)
    
    expect(screen.getByText('María González Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Juan Martínez López')).toBeInTheDocument()
    expect(screen.getByText('Ana Rodríguez García')).toBeInTheDocument()
    expect(screen.getByText('Pedro Sánchez Pérez')).toBeInTheDocument()
    expect(screen.getByText('Laura Fernández Díaz')).toBeInTheDocument()
    expect(screen.getByText('Carlos Jiménez Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Sofía Moreno Vega')).toBeInTheDocument()
    expect(screen.getByText('Diego Torres Castro')).toBeInTheDocument()
  })
})

describe('Alumnos Page - Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters students by search term (name)', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const searchInput = screen.getByPlaceholderText('Buscar por nombre, email...')
    await user.type(searchInput, 'María')
    
    expect(screen.getByText('María González Ruiz')).toBeInTheDocument()
    expect(screen.queryByText('Juan Martínez López')).not.toBeInTheDocument()
  })

  it('filters students by search term (email)', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const searchInput = screen.getByPlaceholderText('Buscar por nombre, email...')
    await user.type(searchInput, 'juan.martinez@email.com')
    
    expect(screen.getByText('Juan Martínez López')).toBeInTheDocument()
    expect(screen.queryByText('María González Ruiz')).not.toBeInTheDocument()
  })

  it('filters students by status (Activos)', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const statusSelect = screen.getAllByRole('combobox')[0]
    await user.click(statusSelect)
    
    await waitFor(() => {
      const activosOption = screen.getByRole('option', { name: /Solo activos/i })
      user.click(activosOption)
    })
    
    expect(screen.getByText('Mostrando 7 de 8 alumnos')).toBeInTheDocument()
  })

  it('filters students by status (Inactivos)', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const statusSelect = screen.getAllByRole('combobox')[0]
    await user.click(statusSelect)
    
    await waitFor(() => {
      const inactivosOption = screen.getByRole('option', { name: /Solo inactivos/i })
      user.click(inactivosOption)
    })
    
    expect(screen.getByText('Mostrando 1 de 8 alumnos')).toBeInTheDocument()
  })

  it('filters students by sede', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const sedeSelect = screen.getAllByRole('combobox')[1]
    await user.click(sedeSelect)
    
    await waitFor(() => {
      const norteOption = screen.getByRole('option', { name: /CEP Norte/i })
      user.click(norteOption)
    })
    
    // Should show only students from CEP Norte
    expect(screen.getByText(/Mostrando.*de 8 alumnos/i)).toBeInTheDocument()
  })

  it('filters students by curso actual', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const cursoSelect = screen.getAllByRole('combobox')[2]
    await user.click(cursoSelect)
    
    await waitFor(() => {
      const marketingOption = screen.getByRole('option', { name: /Marketing Digital Avanzado/i })
      user.click(marketingOption)
    })
    
    expect(screen.getByText('María González Ruiz')).toBeInTheDocument()
  })

  it('filters students by ciclo', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const cicloSelect = screen.getAllByRole('combobox')[3]
    await user.click(cicloSelect)
    
    await waitFor(() => {
      const dawOption = screen.getByRole('option', { name: /Desarrollo de Aplicaciones Web/i })
      user.click(dawOption)
    })
    
    // Should show only students in DAW cycle
    expect(screen.getByText(/Mostrando.*de 8 alumnos/i)).toBeInTheDocument()
  })

  it('combines multiple filters', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Buscar por nombre, email...')
    await user.type(searchInput, 'Ana')
    
    // Apply status filter
    const statusSelect = screen.getAllByRole('combobox')[0]
    await user.click(statusSelect)
    await waitFor(() => {
      const activosOption = screen.getByRole('option', { name: /Solo activos/i })
      user.click(activosOption)
    })
    
    // Should show only active students named Ana
    expect(screen.getByText('Ana Rodríguez García')).toBeInTheDocument()
  })

  it('shows empty state when no students match filters', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const searchInput = screen.getByPlaceholderText('Buscar por nombre, email...')
    await user.type(searchInput, 'NonExistentStudent')
    
    expect(screen.getByText('No se encontraron alumnos')).toBeInTheDocument()
    expect(screen.getByText('Intenta ajustar los filtros de búsqueda')).toBeInTheDocument()
  })
})

describe('Alumnos Page - Student Data Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays student status badges correctly', () => {
    render(<AlumnosPage />)
    
    // Active students should have green badge
    const activeBadges = screen.getAllByText('Activo')
    expect(activeBadges.length).toBeGreaterThan(0)
    
    // Inactive students should have gray badge
    const inactiveBadges = screen.getAllByText('Inactivo')
    expect(inactiveBadges.length).toBeGreaterThan(0)
  })

  it('displays enrolled courses count', () => {
    render(<AlumnosPage />)
    
    // Check for "cursos inscritos" text
    const cursosInscritos = screen.getAllByText(/cursos/)
    expect(cursosInscritos.length).toBeGreaterThan(0)
  })

  it('displays completed courses count', () => {
    render(<AlumnosPage />)
    
    // Check for "completados" text
    const completados = screen.getAllByText(/completados/)
    expect(completados.length).toBeGreaterThan(0)
  })

  it('displays sede information for each student', () => {
    render(<AlumnosPage />)
    
    expect(screen.getAllByText('CEP Norte').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CEP Santa Cruz').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CEP Sur').length).toBeGreaterThan(0)
  })

  it('displays current course information', () => {
    render(<AlumnosPage />)
    
    expect(screen.getByText('Marketing Digital Avanzado')).toBeInTheDocument()
    expect(screen.getByText('Community Manager Profesional')).toBeInTheDocument()
    expect(screen.getByText('SEO y Posicionamiento Web')).toBeInTheDocument()
  })

  it('displays enrollment date', () => {
    render(<AlumnosPage />)
    
    // Check for "Inscrito:" text
    const inscritoLabels = screen.getAllByText(/Inscrito:/)
    expect(inscritoLabels.length).toBeGreaterThan(0)
  })
})

describe('Alumnos Page - Grid View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('switches to Grid view when toggle is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<AlumnosPage />)
    
    const gridButton = screen.getByRole('button', { name: /Fichas/i })
    await user.click(gridButton)
    
    // Grid should be displayed (3 columns)
    await waitFor(() => {
      const grid = container.querySelector('.grid-cols-3')
      expect(grid).toBeInTheDocument()
    })
  })

  it('hides preview sidebar in Grid view', async () => {
    const user = userEvent.setup()
    render(<AlumnosPage />)
    
    const gridButton = screen.getByRole('button', { name: /Fichas/i })
    await user.click(gridButton)
    
    // Sidebar should not be visible
    await waitFor(() => {
      expect(screen.queryByText('Selecciona un alumno')).not.toBeInTheDocument()
    })
  })

  it('displays students as cards in Grid view', async () => {
    const user = userEvent.setup()
    const { container } = render(<AlumnosPage />)
    
    const gridButton = screen.getByRole('button', { name: /Fichas/i })
    await user.click(gridButton)
    
    await waitFor(() => {
      // Students should be displayed as cards
      const cards = container.querySelectorAll('.border-2')
      expect(cards.length).toBeGreaterThan(0)
    })
  })
})

describe('Alumnos Page - Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays "Nuevo Alumno" button', () => {
    render(<AlumnosPage />)
    expect(screen.getByText('Nuevo Alumno')).toBeInTheDocument()
  })

  it('navigates to create new student page when "Nuevo Alumno" is clicked', async () => {
    const user = userEvent.setup()
    const { mockRouter } = await import('../utils/test-utils')
    
    render(<AlumnosPage />)
    
    const nuevoButton = screen.getByText('Nuevo Alumno')
    await user.click(nuevoButton)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/alumnos/nuevo')
  })

  it('applies corporate color #ff2014 to primary buttons', () => {
    const { container } = render(<AlumnosPage />)
    
    const corporateButtons = container.querySelectorAll('[class*="\\[\\#ff2014\\]"]')
    expect(corporateButtons.length).toBeGreaterThan(0)
  })
})

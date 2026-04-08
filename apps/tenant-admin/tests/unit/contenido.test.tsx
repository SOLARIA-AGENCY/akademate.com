import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import CampusContenidoPage from '../../app/(app)/(dashboard)/campus-virtual/contenido/page'

describe('CampusContenidoPage — filtros y búsqueda', () => {
  it('renderiza el encabezado de la página', () => {
    render(<CampusContenidoPage data-oid="l.m:ten" />)
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Módulos y Lecciones')
    expect(screen.getByTestId('page-header-description')).toHaveTextContent(
      'Estado de contenido estructurado por curso.'
    )
  })

  it('renderiza controles de búsqueda y filtro', () => {
    render(<CampusContenidoPage data-oid="controls" />)
    expect(screen.getByPlaceholderText('Buscar por curso...')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renderiza cabeceras de tabla', () => {
    render(<CampusContenidoPage data-oid="headers" />)
    expect(screen.getByText('Curso')).toBeInTheDocument()
    expect(screen.getByText('Módulos')).toBeInTheDocument()
    expect(screen.getByText('Lecciones')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Acciones')).toBeInTheDocument()
  })

  it('inicia sin filas de contenido en el inventario', () => {
    render(<CampusContenidoPage data-oid="empty-table" />)
    const body = screen.getByTestId('table-body')
    expect(body.children.length).toBe(0)
  })

  it('actualiza el término de búsqueda al escribir', async () => {
    const user = userEvent.setup()
    render(<CampusContenidoPage data-oid="search-input" />)

    const input = screen.getByPlaceholderText('Buscar por curso...') as HTMLInputElement
    await user.type(input, 'React')

    expect(input.value).toBe('React')
  })

  it('permite cambiar filtro de estado', () => {
    render(<CampusContenidoPage data-oid="status-filter" />)
    const select = screen.getByRole('combobox') as HTMLSelectElement

    fireEvent.change(select, { target: { value: 'published' } })
    expect(select.value).toBe('published')

    fireEvent.change(select, { target: { value: 'draft' } })
    expect(select.value).toBe('draft')
  })

  it('mantiene tabla vacía tras aplicar búsqueda y filtro combinados', async () => {
    const user = userEvent.setup()
    render(<CampusContenidoPage data-oid="combined-filters" />)

    const input = screen.getByPlaceholderText('Buscar por curso...')
    const select = screen.getByRole('combobox')

    await user.type(input, 'node')
    fireEvent.change(select, { target: { value: 'published' } })

    const body = screen.getByTestId('table-body')
    expect(body.children.length).toBe(0)
  })
})

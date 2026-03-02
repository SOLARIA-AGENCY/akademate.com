import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import CampusContenidoPage from '../../app/(dashboard)/campus-virtual/contenido/page'

describe('CampusContenidoPage — filtros y búsqueda', () => {
  it('renderiza el título de la página', () => {
    render(<CampusContenidoPage />)
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Módulos y Lecciones')
  })

  it('muestra los 3 cursos por defecto (sin filtro)', () => {
    render(<CampusContenidoPage />)
    expect(screen.getByText('React Inicial')).toBeInTheDocument()
    expect(screen.getByText('Node Backend')).toBeInTheDocument()
    expect(screen.getByText('Marketing Digital')).toBeInTheDocument()
  })

  describe('filtro de búsqueda por nombre', () => {
    it('filtra por término "React" → solo muestra React Inicial', async () => {
      const user = userEvent.setup()
      render(<CampusContenidoPage />)
      const input = screen.getByPlaceholderText('Buscar por curso...')
      await user.type(input, 'React')
      expect(screen.getByText('React Inicial')).toBeInTheDocument()
      expect(screen.queryByText('Node Backend')).toBeNull()
      expect(screen.queryByText('Marketing Digital')).toBeNull()
    })

    it('búsqueda es case-insensitive: "node" encuentra "Node Backend"', async () => {
      const user = userEvent.setup()
      render(<CampusContenidoPage />)
      const input = screen.getByPlaceholderText('Buscar por curso...')
      await user.type(input, 'node')
      expect(screen.getByText('Node Backend')).toBeInTheDocument()
      expect(screen.queryByText('React Inicial')).toBeNull()
    })

    it('búsqueda con término que no existe → no muestra filas', async () => {
      const user = userEvent.setup()
      render(<CampusContenidoPage />)
      const input = screen.getByPlaceholderText('Buscar por curso...')
      await user.type(input, 'Python')
      expect(screen.queryByText('React Inicial')).toBeNull()
      expect(screen.queryByText('Node Backend')).toBeNull()
      expect(screen.queryByText('Marketing Digital')).toBeNull()
    })

    it('limpiar búsqueda restaura los 3 cursos', async () => {
      const user = userEvent.setup()
      render(<CampusContenidoPage />)
      const input = screen.getByPlaceholderText('Buscar por curso...')
      await user.type(input, 'React')
      await user.clear(input)
      expect(screen.getByText('React Inicial')).toBeInTheDocument()
      expect(screen.getByText('Node Backend')).toBeInTheDocument()
      expect(screen.getByText('Marketing Digital')).toBeInTheDocument()
    })
  })

  describe('filtro por estado', () => {
    it('filtrar por "published" muestra solo cursos publicados', () => {
      render(<CampusContenidoPage />)
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'published' } })
      expect(screen.getByText('React Inicial')).toBeInTheDocument()
      expect(screen.getByText('Node Backend')).toBeInTheDocument()
      expect(screen.queryByText('Marketing Digital')).toBeNull()
    })

    it('filtrar por "draft" muestra solo borradores', () => {
      render(<CampusContenidoPage />)
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'draft' } })
      expect(screen.getByText('Marketing Digital')).toBeInTheDocument()
      expect(screen.queryByText('React Inicial')).toBeNull()
      expect(screen.queryByText('Node Backend')).toBeNull()
    })

    it('filtrar por "all" muestra todos los cursos', () => {
      render(<CampusContenidoPage />)
      const select = screen.getByRole('combobox')
      // Change to draft then back to all
      fireEvent.change(select, { target: { value: 'draft' } })
      fireEvent.change(select, { target: { value: 'all' } })
      expect(screen.getByText('React Inicial')).toBeInTheDocument()
      expect(screen.getByText('Node Backend')).toBeInTheDocument()
      expect(screen.getByText('Marketing Digital')).toBeInTheDocument()
    })
  })

  describe('filtros combinados', () => {
    it('búsqueda + estado juntos aplican ambos filtros', async () => {
      const user = userEvent.setup()
      render(<CampusContenidoPage />)
      // Filter by "published" first
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'published' } })
      // Then search for "node"
      const input = screen.getByPlaceholderText('Buscar por curso...')
      await user.type(input, 'node')
      expect(screen.getByText('Node Backend')).toBeInTheDocument()
      expect(screen.queryByText('React Inicial')).toBeNull()
      expect(screen.queryByText('Marketing Digital')).toBeNull()
    })

    it('búsqueda published + término inexistente → sin resultados', async () => {
      const user = userEvent.setup()
      render(<CampusContenidoPage />)
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'published' } })
      const input = screen.getByPlaceholderText('Buscar por curso...')
      await user.type(input, 'Marketing')
      // Marketing Digital is draft, not published
      expect(screen.queryByText('Marketing Digital')).toBeNull()
      expect(screen.queryByText('React Inicial')).toBeNull()
    })
  })

  describe('datos de la tabla', () => {
    it('muestra módulos y lecciones correctos para React Inicial', () => {
      render(<CampusContenidoPage />)
      // React Inicial: 8 módulos, 42 lecciones
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('muestra módulos y lecciones correctos para Node Backend', () => {
      render(<CampusContenidoPage />)
      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('31')).toBeInTheDocument()
    })

    it('muestra las cabeceras de tabla correctas', () => {
      render(<CampusContenidoPage />)
      expect(screen.getByText('Curso')).toBeInTheDocument()
      expect(screen.getByText('Módulos')).toBeInTheDocument()
      expect(screen.getByText('Lecciones')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
    })
  })
})

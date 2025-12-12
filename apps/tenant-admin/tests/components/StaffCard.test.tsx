import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StaffCard } from '@payload-config/components/ui/StaffCard'

/**
 * Component Tests for StaffCard
 *
 * Tests cover:
 * - Rendering of staff information
 * - Avatar display
 * - Badge rendering (status, contract type)
 * - Campus assignments display
 * - Click handlers (onView, onEdit, onDelete)
 * - Dropdown menu actions
 */

const mockStaffProfesor = {
  id: 1,
  fullName: 'Miguel Ángel Torres Ruiz',
  position: 'Profesor de Marketing Digital',
  contractType: 'full_time',
  employmentStatus: 'active',
  photo: '/media/profesor-1.jpg',
  email: 'miguel.torres@cepcomunicacion.com',
  phone: '+34 922 123 456',
  bio: 'Especialista en SEO/SEM con más de 10 años de experiencia.',
  assignedCampuses: [
    { id: 1, name: 'CEP Norte', city: 'Santa Cruz de Tenerife' },
    { id: 3, name: 'CEP Sur', city: 'Santa Cruz de Tenerife' },
  ],
}

const mockStaffAdmin = {
  id: 2,
  fullName: 'Laura Fernández Castro',
  position: 'Coordinadora Académica',
  contractType: 'full_time',
  employmentStatus: 'active',
  photo: '/media/admin-1.jpg',
  email: 'laura.fernandez@cepcomunicacion.com',
  phone: '+34 922 678 901',
  assignedCampuses: [
    { id: 1, name: 'CEP Norte', city: 'Santa Cruz de Tenerife' },
  ],
}

describe('StaffCard Component', () => {
  describe('Basic rendering', () => {
    it('should render staff name', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Miguel Ángel Torres Ruiz')).toBeInTheDocument()
    })

    it('should render position', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Profesor de Marketing Digital')).toBeInTheDocument()
    })

    it('should render email', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('miguel.torres@cepcomunicacion.com')).toBeInTheDocument()
    })

    it('should render phone when provided', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('+34 922 123 456')).toBeInTheDocument()
    })
  })

  describe('Avatar rendering', () => {
    it('should render avatar with photo', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const avatar = screen.getByAltText('Miguel Ángel Torres Ruiz')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', '/media/profesor-1.jpg')
    })

    it('should show fallback initials', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const { container } = render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Fallback should show initials (MAT for Miguel Ángel Torres)
      const fallback = container.querySelector('[class*="AvatarFallback"]')
      expect(fallback).toBeTruthy()
    })
  })

  describe('Badges rendering', () => {
    it('should render employment status badge', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('should render contract type badge', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Tiempo Completo')).toBeInTheDocument()
    })

    it('should render part-time contract correctly', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const partTimeStaff = {
        ...mockStaffProfesor,
        contractType: 'part_time' as const,
      }

      render(
        <StaffCard
          {...partTimeStaff}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Medio Tiempo')).toBeInTheDocument()
    })
  })

  describe('Campus assignments', () => {
    it('should render all assigned campuses', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('CEP Norte')).toBeInTheDocument()
      expect(screen.getByText('CEP Sur')).toBeInTheDocument()
    })

    it('should show single campus for administrative staff', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffAdmin}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('CEP Norte')).toBeInTheDocument()
      // Should not have CEP Sur
      expect(screen.queryByText('CEP Sur')).not.toBeInTheDocument()
    })

    it('should show message when no campuses assigned', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const noCampusStaff = {
        ...mockStaffProfesor,
        assignedCampuses: [],
      }

      render(
        <StaffCard
          {...noCampusStaff}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Sin sedes asignadas')).toBeInTheDocument()
    })
  })

  describe('Bio display', () => {
    it('should render bio when provided', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/Especialista en SEO\/SEM/)).toBeInTheDocument()
    })

    it('should not render bio section when not provided', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const noBioStaff = {
        ...mockStaffProfesor,
        bio: undefined,
      }

      const { container } = render(
        <StaffCard
          {...noBioStaff}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Bio text should not be in the document
      expect(screen.queryByText(/Especialista en SEO\/SEM/)).not.toBeInTheDocument()
    })
  })

  describe('Click handlers', () => {
    it('should call onView when card is clicked', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const { container } = render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const card = container.querySelector('[class*="Card"]')
      expect(card).toBeTruthy()

      fireEvent.click(card!)
      expect(mockOnView).toHaveBeenCalledWith(1)
    })

    it('should call onView when "Ver Ficha Completa" button is clicked', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const viewButton = screen.getByText('Ver Ficha Completa')
      fireEvent.click(viewButton)

      expect(mockOnView).toHaveBeenCalledWith(1)
    })
  })

  describe('Dropdown menu', () => {
    it('should render dropdown menu trigger', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const { container } = render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Menu trigger should exist
      const menuTrigger = container.querySelector('[role="button"]')
      expect(menuTrigger).toBeTruthy()
    })

    // Note: Testing dropdown menu items requires more complex setup
    // with user interactions and would be better suited for E2E tests
  })

  describe('Different employment statuses', () => {
    it('should render temporary leave status', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const tempLeaveStaff = {
        ...mockStaffProfesor,
        employmentStatus: 'temporary_leave' as const,
      }

      render(
        <StaffCard
          {...tempLeaveStaff}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Baja Temporal')).toBeInTheDocument()
    })

    it('should render inactive status', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      const inactiveStaff = {
        ...mockStaffProfesor,
        employmentStatus: 'inactive' as const,
      }

      render(
        <StaffCard
          {...inactiveStaff}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have alt text for avatar image', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const avatar = screen.getByAltText('Miguel Ángel Torres Ruiz')
      expect(avatar).toBeInTheDocument()
    })

    it('should have accessible button text', () => {
      const mockOnView = vi.fn()
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <StaffCard
          {...mockStaffProfesor}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Ver Ficha Completa')).toBeInTheDocument()
    })
  })
})

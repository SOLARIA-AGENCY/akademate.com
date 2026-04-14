import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

// Simple empty-state pages (icon + heading + description, no external deps)
import EnrollmentsPage from '@/app/(app)/enrollments/page'
import CoursesPage from '@/app/(app)/courses/page'
import UsersPage from '@/app/(app)/users/page'
import AssignmentsPage from '@/app/(app)/assignments/page'
import SettingsPage from '@/app/(app)/settings/page'
import ReportsPage from '@/app/(app)/reports/page'
import CertificatesPage from '@/app/(app)/certificates/page'

// Complex pages with empty data arrays
import MatriculasPage from '@/app/(app)/(dashboard)/matriculas/page'
import ListaEsperaPage from '@/app/(app)/(dashboard)/lista-espera/page'

describe('Empty State Pages', () => {
  describe('EnrollmentsPage', () => {
    it('renders heading and description', () => {
      render(<EnrollmentsPage />)
      expect(screen.getByText('Inscripciones')).toBeInTheDocument()
      expect(
        screen.getByText(/No hay inscripciones registradas/)
      ).toBeInTheDocument()
    })
  })

  describe('CoursesPage', () => {
    it('renders heading and description', () => {
      render(<CoursesPage />)
      expect(screen.getByText('Cursos')).toBeInTheDocument()
      expect(screen.getByText(/No hay cursos creados/)).toBeInTheDocument()
    })
  })

  describe('UsersPage', () => {
    it('renders heading and description', () => {
      render(<UsersPage />)
      expect(screen.getByText('Usuarios')).toBeInTheDocument()
      expect(
        screen.getByText(/Gestiona los usuarios desde Administracion/)
      ).toBeInTheDocument()
    })
  })

  describe('AssignmentsPage', () => {
    it('renders heading and description', () => {
      render(<AssignmentsPage />)
      expect(screen.getByText('Entregas')).toBeInTheDocument()
      expect(
        screen.getByText(/No hay entregas pendientes/)
      ).toBeInTheDocument()
    })
  })

  describe('SettingsPage', () => {
    it('renders heading and description', () => {
      render(<SettingsPage />)
      expect(screen.getByText('Configuracion')).toBeInTheDocument()
      expect(
        screen.getByText(/Accede a la configuracion desde el sidebar/)
      ).toBeInTheDocument()
    })
  })

  describe('ReportsPage', () => {
    it('renders heading and description', () => {
      render(<ReportsPage />)
      expect(screen.getByText('Informes')).toBeInTheDocument()
      expect(
        screen.getByText(/Los informes se generaran automaticamente/)
      ).toBeInTheDocument()
    })
  })

  describe('CertificatesPage', () => {
    it('renders heading and description', () => {
      render(<CertificatesPage />)
      expect(screen.getByText('Certificados')).toBeInTheDocument()
      expect(
        screen.getByText(/Los certificados estaran disponibles/)
      ).toBeInTheDocument()
    })
  })
})

describe('Pages with Empty Data Arrays', () => {
  describe('MatriculasPage', () => {
    it('renders without crashing and shows zero stats', () => {
      render(<MatriculasPage />)
      expect(screen.getByText('Total Solicitudes')).toBeInTheDocument()
      // All stats should be 0 since data array is empty
      const zeroValues = screen.getAllByText('0')
      expect(zeroValues.length).toBeGreaterThanOrEqual(4)
    })

    it('renders the table header', () => {
      render(<MatriculasPage />)
      expect(screen.getByText('Solicitudes de Matrícula (0)')).toBeInTheDocument()
    })
  })

  describe('ListaEsperaPage', () => {
    it('renders without crashing and shows zero stats', () => {
      render(<ListaEsperaPage />)
      expect(screen.getByText('Total en Espera')).toBeInTheDocument()
      const zeroValues = screen.getAllByText('0')
      expect(zeroValues.length).toBeGreaterThanOrEqual(4)
    })

    it('renders the table header', () => {
      render(<ListaEsperaPage />)
      expect(screen.getByText('Cola de Espera (0)')).toBeInTheDocument()
    })
  })
})

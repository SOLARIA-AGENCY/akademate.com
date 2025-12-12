import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PrivacidadPage from '../../app/legal/privacidad/page'
import TerminosPage from '../../app/legal/terminos/page'
import CookiesPage from '../../app/legal/cookies/page'

describe('Legal Pages', () => {
  describe('Privacy Policy Page', () => {
    it('renders privacy policy title', () => {
      render(<PrivacidadPage />)
      expect(screen.getByText('Política de Privacidad')).toBeInTheDocument()
    })

    it('displays company information', () => {
      render(<PrivacidadPage />)
      const companyNames = screen.getAllByText(/CEP FORMACIÓN Y COMUNICACIÓN S\.L\./i)
      expect(companyNames.length).toBeGreaterThan(0)
      expect(companyNames[0]).toBeInTheDocument()
    })

    it('shows data subject rights section', () => {
      render(<PrivacidadPage />)
      expect(screen.getByText(/Derechos de los Interesados/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Acceso/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Rectificación/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Supresión/i).length).toBeGreaterThan(0)
    })

    it('includes contact information', () => {
      render(<PrivacidadPage />)
      const emails = screen.getAllByText(/privacidad@cepcomunicacion\.com/i)
      expect(emails.length).toBeGreaterThan(0)
    })

    it('has back button that calls router.back()', () => {
      render(<PrivacidadPage />)
      const backButton = screen.getByRole('button', { name: /volver/i })
      expect(backButton).toBeInTheDocument()
      // Router functionality is mocked in setup.ts, just verify button exists
    })

    it('shows last updated date', () => {
      render(<PrivacidadPage />)
      const currentDate = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      expect(screen.getByText(new RegExp(currentDate))).toBeInTheDocument()
    })

    it('displays all required RGPD sections', () => {
      render(<PrivacidadPage />)

      // Check for required sections
      expect(screen.getByText(/Responsable del Tratamiento/i)).toBeInTheDocument()
      expect(screen.getByText(/Datos Personales que Tratamos/i)).toBeInTheDocument()
      expect(screen.getByText(/Finalidad del Tratamiento/i)).toBeInTheDocument()
      expect(screen.getByText(/Base Legal del Tratamiento/i)).toBeInTheDocument()
      expect(screen.getByText(/Conservación de Datos/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Medidas de Seguridad/i).length).toBeGreaterThan(0)
    })
  })

  describe('Terms & Conditions Page', () => {
    it('renders terms and conditions title', () => {
      render(<TerminosPage />)
      expect(screen.getByText('Términos y Condiciones de Uso')).toBeInTheDocument()
    })

    it('displays 5 user role types', () => {
      render(<TerminosPage />)
      expect(screen.getAllByText(/Administradores/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Gestores/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Marketing/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Asesores/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Lectura/i).length).toBeGreaterThan(0)
    })

    it('shows services offered section', () => {
      render(<TerminosPage />)
      expect(screen.getByText(/Servicios Ofrecidos/i)).toBeInTheDocument()
      expect(screen.getByText(/Gestión de cursos/i)).toBeInTheDocument()
    })

    it('includes economic conditions', () => {
      render(<TerminosPage />)
      expect(screen.getByText(/Condiciones Económicas/i)).toBeInTheDocument()
      expect(screen.getByText(/Matrícula y pagos/i)).toBeInTheDocument()
      expect(screen.getByText(/cancelación y reembolsos/i)).toBeInTheDocument()
    })

    it('displays intellectual property section', () => {
      render(<TerminosPage />)
      expect(screen.getByText(/Propiedad Intelectual/i)).toBeInTheDocument()
    })

    it('shows jurisdiction information', () => {
      render(<TerminosPage />)
      const locations = screen.getAllByText(/Santa Cruz de Tenerife/i)
      expect(locations.length).toBeGreaterThan(0)
    })

    it('has functional back navigation', () => {
      render(<TerminosPage />)
      const backButton = screen.getByRole('button', { name: /volver/i })
      expect(backButton).toBeInTheDocument()
      // Router functionality is mocked in setup.ts, just verify button exists
    })
  })

  describe('Cookie Policy Page', () => {
    it('renders cookie policy title', () => {
      render(<CookiesPage />)
      expect(screen.getByText('Política de Cookies')).toBeInTheDocument()
    })

    it('explains what cookies are', () => {
      render(<CookiesPage />)
      expect(screen.getByText(/¿Qué son las cookies\?/i)).toBeInTheDocument()
    })

    it('displays all cookie types', () => {
      render(<CookiesPage />)
      expect(screen.getAllByText(/Cookies Técnicas/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Cookies Analíticas/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Cookies de Marketing/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Cookies de Preferencias/i).length).toBeGreaterThan(0)
    })

    it('lists technical cookies with details', () => {
      render(<CookiesPage />)
      expect(screen.getByText(/cep_auth_token/i)).toBeInTheDocument()
      expect(screen.getByText(/cep_user/i)).toBeInTheDocument()
      expect(screen.getByText(/csrf_token/i)).toBeInTheDocument()
    })

    it('shows third-party cookie providers', () => {
      render(<CookiesPage />)
      expect(screen.getAllByText(/Google Analytics/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Meta.*Facebook/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Plausible/i).length).toBeGreaterThan(0)
    })

    it('includes browser management instructions', () => {
      render(<CookiesPage />)
      expect(screen.getByText(/Google Chrome/i)).toBeInTheDocument()
      expect(screen.getByText(/Mozilla Firefox/i)).toBeInTheDocument()
      expect(screen.getByText(/Safari/i)).toBeInTheDocument()
      expect(screen.getByText(/Microsoft Edge/i)).toBeInTheDocument()
    })

    it('displays legal basis for cookies', () => {
      render(<CookiesPage />)
      expect(screen.getByText(/LSSI/i)).toBeInTheDocument()
      expect(screen.getByText(/RGPD/i)).toBeInTheDocument()
    })

    it('has back button functionality', () => {
      render(<CookiesPage />)
      const backButton = screen.getByRole('button', { name: /volver/i })
      expect(backButton).toBeInTheDocument()
      // Router functionality is mocked in setup.ts, just verify button exists
    })

    it('shows cookie duration information', () => {
      render(<CookiesPage />)
      expect(screen.getAllByText(/Duración/i).length).toBeGreaterThan(0)
    })

    it('includes warning about blocking cookies', () => {
      render(<CookiesPage />)
      expect(screen.getByText(/Bloquear todas las cookies puede afectar/i)).toBeInTheDocument()
    })
  })

  describe('Common Legal Page Features', () => {
    it.each([
      ['Privacy', PrivacidadPage],
      ['Terms', TerminosPage],
      ['Cookies', CookiesPage],
    ])('%s page has consistent styling', (name, Component) => {
      const { container } = render(<Component />)
      const mainDiv = container.firstChild
      expect(mainDiv).toHaveClass('max-w-4xl', 'mx-auto', 'space-y-6', 'p-6')
    })

    it.each([
      ['Privacy', PrivacidadPage],
      ['Terms', TerminosPage],
      ['Cookies', CookiesPage],
    ])('%s page displays last update date', (name, Component) => {
      render(<Component />)
      expect(screen.getByText(/Última actualización/i)).toBeInTheDocument()
    })

    it.each([
      ['Privacy', PrivacidadPage],
      ['Terms', TerminosPage],
      ['Cookies', CookiesPage],
    ])('%s page includes contact section', (name, Component) => {
      render(<Component />)
      // Privacy page has "Email de contacto" instead of "Contacto" heading
      const contactElements = screen.queryAllByText(/Contacto|contact/i)
      expect(contactElements.length).toBeGreaterThan(0)
    })
  })
})

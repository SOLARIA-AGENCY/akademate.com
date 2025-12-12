import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardFooter } from '../../@payload-config/components/layout/DashboardFooter'

describe('Dashboard Footer', () => {
  describe('Rendering', () => {
    it('renders the footer component', () => {
      const { container } = render(<DashboardFooter />)
      const footer = container.querySelector('footer')
      expect(footer).toBeInTheDocument()
    })

    it('has proper border and background styling', () => {
      const { container } = render(<DashboardFooter />)
      const footer = container.querySelector('footer')
      expect(footer).toHaveClass('border-t', 'bg-card', 'mt-auto')
    })

    it('uses consistent padding', () => {
      const { container } = render(<DashboardFooter />)
      const contentDiv = container.querySelector('.py-3')
      expect(contentDiv).toBeInTheDocument()
    })
  })

  describe('Legal Links Section (Left)', () => {
    it('displays privacy policy link', () => {
      render(<DashboardFooter />)
      const privacyLink = screen.getByRole('link', { name: /privacidad/i })
      expect(privacyLink).toBeInTheDocument()
      expect(privacyLink).toHaveAttribute('href', '/legal/privacidad')
    })

    it('displays terms & conditions link', () => {
      render(<DashboardFooter />)
      const termsLink = screen.getByRole('link', { name: /términos/i })
      expect(termsLink).toBeInTheDocument()
      expect(termsLink).toHaveAttribute('href', '/legal/terminos')
    })

    it('displays cookies policy link', () => {
      render(<DashboardFooter />)
      const cookiesLink = screen.getByRole('link', { name: /cookies/i })
      expect(cookiesLink).toBeInTheDocument()
      expect(cookiesLink).toHaveAttribute('href', '/legal/cookies')
    })

    it('separates legal links with dots', () => {
      render(<DashboardFooter />)
      const separators = screen.getAllByText('•')
      expect(separators.length).toBe(2)
    })

    it('includes icons for each legal link', () => {
      const { container } = render(<DashboardFooter />)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThanOrEqual(4) // 3 legal + 1 status
    })
  })

  describe('System Status Link (Right)', () => {
    it('displays system status link', () => {
      render(<DashboardFooter />)
      const statusLink = screen.getByRole('link', { name: /estado del sistema/i })
      expect(statusLink).toBeInTheDocument()
      expect(statusLink).toHaveAttribute('href', '/estado')
    })

    it('includes Activity icon for system status', () => {
      const { container } = render(<DashboardFooter />)
      const statusLink = screen.getByRole('link', { name: /estado del sistema/i })
      const icon = statusLink.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Layout and Alignment', () => {
    it('uses flexbox for layout', () => {
      const { container } = render(<DashboardFooter />)
      const flexContainer = container.querySelector('.flex.items-center.justify-between')
      expect(flexContainer).toBeInTheDocument()
    })

    it('aligns legal links to the left', () => {
      const { container } = render(<DashboardFooter />)
      const leftSection = container.querySelector('.flex.items-center.gap-3')
      expect(leftSection).toBeInTheDocument()
    })

    it('has no redundant copyright text', () => {
      render(<DashboardFooter />)
      const copyrightText = screen.queryByText(/© 2025 CEP/)
      expect(copyrightText).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('all links have descriptive text', () => {
      render(<DashboardFooter />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link.textContent).toBeTruthy()
        expect(link.textContent?.trim().length).toBeGreaterThan(0)
      })
    })

    it('uses semantic footer element', () => {
      const { container } = render(<DashboardFooter />)
      const footer = container.querySelector('footer')
      expect(footer).toBeInTheDocument()
    })

    it('has proper contrast for links', () => {
      const { container } = render(<DashboardFooter />)
      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveClass('text-muted-foreground', 'hover:text-foreground')
      })
    })
  })

  describe('Responsive Design', () => {
    it('has responsive padding', () => {
      const { container } = render(<DashboardFooter />)
      const innerContainer = container.querySelector('.container')
      expect(innerContainer).toHaveClass('mx-auto', 'px-4', 'py-3')
    })

    it('uses appropriate text size', () => {
      const { container } = render(<DashboardFooter />)
      const textContainer = container.querySelector('.text-sm')
      expect(textContainer).toBeInTheDocument()
    })

    it('has gap spacing for links', () => {
      const { container } = render(<DashboardFooter />)
      const linkContainer = container.querySelector('.gap-3')
      expect(linkContainer).toBeInTheDocument()
    })
  })

  describe('Hover States', () => {
    it('applies transition classes to links', () => {
      const { container } = render(<DashboardFooter />)
      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveClass('transition-colors')
      })
    })
  })

  describe('Icon Sizing', () => {
    it('uses consistent icon size', () => {
      const { container } = render(<DashboardFooter />)
      const icons = container.querySelectorAll('svg')
      icons.forEach(icon => {
        expect(icon).toHaveClass('h-3.5', 'w-3.5')
      })
    })
  })
})

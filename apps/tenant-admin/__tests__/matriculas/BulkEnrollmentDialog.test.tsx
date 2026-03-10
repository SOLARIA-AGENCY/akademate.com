/**
 * @fileoverview Unit Tests for BulkEnrollmentDialog Component
 *
 * Tests cover:
 * - Initial render and dialog states
 * - UI elements visibility
 * - User interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BulkEnrollmentDialog } from '@/app/(dashboard)/matriculas/components/BulkEnrollmentDialog'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('BulkEnrollmentDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onComplete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Initial Render', () => {
    it('should render dialog when open', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="9xadyz:" />)

      expect(screen.getByText('Importar Matriculas desde CSV')).toBeInTheDocument()
      expect(screen.getByText(/Sube un archivo CSV/)).toBeInTheDocument()
    })

    it('should not render dialog when closed', () => {
      render(<BulkEnrollmentDialog {...defaultProps} open={false} data-oid="l1kixt5" />)

      expect(screen.queryByText('Importar Matriculas desde CSV')).not.toBeInTheDocument()
    })

    it('should show upload instructions', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="tuqpcn0" />)

      expect(screen.getByText(/Arrastra tu archivo CSV/)).toBeInTheDocument()
      expect(screen.getByText('Seleccionar archivo')).toBeInTheDocument()
    })

    it('should show format requirements', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="9qs:dav" />)

      expect(screen.getByText('Formato requerido:')).toBeInTheDocument()
      expect(screen.getByText(/studentEmail, courseRunId/)).toBeInTheDocument()
    })

    it('should have download template button', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="..k4wh." />)

      expect(screen.getByText('Plantilla')).toBeInTheDocument()
    })

    it('should have cancel button on upload step', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="j4sxfql" />)

      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })
  })

  describe('Template Download', () => {
    it('should call API when download template button clicked', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        blob: () => Promise.resolve(mockBlob),
      })

      // Mock URL methods
      const mockCreateObjectURL = vi.fn(() => 'blob:url')
      const mockRevokeObjectURL = vi.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      render(<BulkEnrollmentDialog {...defaultProps} data-oid=":mvevbz" />)

      const templateBtn = screen.getByText('Plantilla')
      fireEvent.click(templateBtn)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/lms/enrollments/bulk')
      })
    })
  })

  describe('File Input', () => {
    it('should have file input element', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="c1.3vrd" />)

      const input = document.getElementById('csv-file-input') as HTMLInputElement
      expect(input).toBeTruthy()
      expect(input.type).toBe('file')
      expect(input.accept).toBe('.csv')
    })

    it('should have drag and drop area', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="jxwy2r9" />)

      expect(screen.getByText(/Arrastra tu archivo CSV/)).toBeInTheDocument()
      expect(screen.getByText(/o haz clic para seleccionar/)).toBeInTheDocument()
    })
  })

  describe('Dialog Close', () => {
    it('should call onOpenChange when cancel clicked', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="ddr2i38" />)

      fireEvent.click(screen.getByText('Cancelar'))

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('UI Elements', () => {
    it('should show upload icon', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="t09ucop" />)

      // Lucide icons render as SVG with specific classes
      const uploadIcon = document.querySelector('.lucide-upload')
      expect(uploadIcon).toBeTruthy()
    })

    it('should show file spreadsheet icon in title', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="aio85h6" />)

      const spreadsheetIcon = document.querySelector('.lucide-file-spreadsheet')
      expect(spreadsheetIcon).toBeTruthy()
    })

    it('should have download icon in template button', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="h537w4i" />)

      const downloadIcon = document.querySelector('.lucide-download')
      expect(downloadIcon).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible dialog title', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="hqipajq" />)

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Importar Matriculas desde CSV')
    })

    it('should have labeled file input', () => {
      render(<BulkEnrollmentDialog {...defaultProps} data-oid="l_6bjk9" />)

      const input = document.getElementById('csv-file-input')
      expect(input).toBeTruthy()

      // Label exists and is for the input
      const label = document.querySelector('label[for="csv-file-input"]')
      expect(label).toBeTruthy()
      expect(label?.textContent).toContain('Seleccionar archivo')
    })
  })
})

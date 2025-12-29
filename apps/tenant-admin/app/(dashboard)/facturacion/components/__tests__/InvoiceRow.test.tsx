import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InvoiceRow } from '../InvoiceRow'
import type { Invoice } from '@payload-config/types/billing'

describe('InvoiceRow', () => {
  const mockOnDownload = vi.fn()
  const mockOnView = vi.fn()

  const baseInvoice: Invoice = {
    id: '123',
    tenantId: 'tenant-1',
    subscriptionId: 'sub-1',
    stripeInvoiceId: 'inv_123',
    number: 'INV-2025-001',
    status: 'paid',
    currency: 'EUR',
    subtotal: 29900,
    tax: 0,
    total: 29900,
    amountPaid: 29900,
    amountDue: 0,
    dueDate: null,
    paidAt: new Date('2025-01-15'),
    hostedInvoiceUrl: 'https://invoice.stripe.com/123',
    invoicePdfUrl: 'https://invoice.stripe.com/123/pdf',
    lineItems: [],
    metadata: {},
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders invoice number', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText('INV-2025-001')).toBeInTheDocument()
  })

  it('renders formatted date', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText(/15 ene\.? 2025/i)).toBeInTheDocument()
  })

  it('renders paid status correctly', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Pagada')).toBeInTheDocument()
  })

  it('renders open status correctly', () => {
    const openInvoice = { ...baseInvoice, status: 'open' as const }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={openInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders void status correctly', () => {
    const voidInvoice = { ...baseInvoice, status: 'void' as const }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={voidInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Anulada')).toBeInTheDocument()
  })

  it('renders draft status correctly', () => {
    const draftInvoice = { ...baseInvoice, status: 'draft' as const }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={draftInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Borrador')).toBeInTheDocument()
  })

  it('renders uncollectible status correctly', () => {
    const uncollectibleInvoice = { ...baseInvoice, status: 'uncollectible' as const }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={uncollectibleInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Incobrable')).toBeInTheDocument()
  })

  it('renders formatted amount in EUR', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText(/299,00\s*€/)).toBeInTheDocument()
  })

  it('renders download button when PDF URL exists', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} onDownload={mockOnDownload} />
        </tbody>
      </table>
    )
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('does not render download button when no PDF URL', () => {
    const noPdfInvoice = { ...baseInvoice, invoicePdfUrl: null }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={noPdfInvoice} onDownload={mockOnDownload} />
        </tbody>
      </table>
    )
    expect(screen.queryByText('PDF')).not.toBeInTheDocument()
  })

  it('renders view button when hosted URL exists', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} onView={mockOnView} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Ver')).toBeInTheDocument()
  })

  it('does not render view button when no hosted URL', () => {
    const noHostedUrlInvoice = { ...baseInvoice, hostedInvoiceUrl: null }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={noHostedUrlInvoice} onView={mockOnView} />
        </tbody>
      </table>
    )
    expect(screen.queryByText('Ver')).not.toBeInTheDocument()
  })

  it('calls onDownload when download button clicked', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} onDownload={mockOnDownload} />
        </tbody>
      </table>
    )
    const downloadButton = screen.getByText('PDF')
    fireEvent.click(downloadButton)
    expect(mockOnDownload).toHaveBeenCalledWith(baseInvoice)
  })

  it('calls onView when view button clicked', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} onView={mockOnView} />
        </tbody>
      </table>
    )
    const viewButton = screen.getByText('Ver')
    fireEvent.click(viewButton)
    expect(mockOnView).toHaveBeenCalledWith(baseInvoice)
  })

  it('does not call onDownload when not provided', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} />
        </tbody>
      </table>
    )
    const downloadButton = screen.getByText('PDF')
    fireEvent.click(downloadButton)
    // Should not throw error
  })

  it('does not call onView when not provided', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} />
        </tbody>
      </table>
    )
    const viewButton = screen.getByText('Ver')
    fireEvent.click(viewButton)
    // Should not throw error
  })

  it('renders with null createdAt date', () => {
    const noDateInvoice = { ...baseInvoice, createdAt: null as any }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={noDateInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('applies hover effect on row', () => {
    const { container } = render(
      <table>
        <tbody>
          <InvoiceRow invoice={baseInvoice} />
        </tbody>
      </table>
    )
    const row = container.querySelector('tr')
    expect(row).toHaveClass('hover:bg-muted/50')
  })

  it('renders different currency amounts correctly', () => {
    const usdInvoice = { ...baseInvoice, currency: 'USD', total: 35000 }
    const { rerender } = render(
      <table>
        <tbody>
          <InvoiceRow invoice={usdInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText(/350[.,]00/)).toBeInTheDocument()

    const gbpInvoice = { ...baseInvoice, currency: 'GBP', total: 25000 }
    rerender(
      <table>
        <tbody>
          <InvoiceRow invoice={gbpInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText(/250[.,]00/)).toBeInTheDocument()
  })

  it('renders large amounts correctly', () => {
    const largeInvoice = { ...baseInvoice, total: 123456789 }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={largeInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText(/1\.234\.567,89\s*€/)).toBeInTheDocument()
  })

  it('handles different date formats correctly', () => {
    const decemberInvoice = { ...baseInvoice, createdAt: new Date('2025-12-25') }
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={decemberInvoice} />
        </tbody>
      </table>
    )
    expect(screen.getByText(/25 dic\.? 2025/i)).toBeInTheDocument()
  })
})

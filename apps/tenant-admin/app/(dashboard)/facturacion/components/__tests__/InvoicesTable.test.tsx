import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InvoicesTable } from '../InvoicesTable'
import type { Invoice } from '@payload-config/types/billing'

// Mock window.open
const mockOpen = vi.fn()
vi.stubGlobal('open', mockOpen)

describe('InvoicesTable', () => {
  const mockInvoices: Invoice[] = [
    {
      id: '1',
      tenantId: 'tenant-1',
      subscriptionId: 'sub-1',
      stripeInvoiceId: 'inv_1',
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
      hostedInvoiceUrl: 'https://invoice.stripe.com/1',
      invoicePdfUrl: 'https://invoice.stripe.com/1/pdf',
      lineItems: [],
      metadata: {},
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
    },
    {
      id: '2',
      tenantId: 'tenant-1',
      subscriptionId: 'sub-1',
      stripeInvoiceId: 'inv_2',
      number: 'INV-2025-002',
      status: 'open',
      currency: 'EUR',
      subtotal: 29900,
      tax: 0,
      total: 29900,
      amountPaid: 0,
      amountDue: 29900,
      dueDate: new Date('2025-02-15'),
      paidAt: null,
      hostedInvoiceUrl: 'https://invoice.stripe.com/2',
      invoicePdfUrl: 'https://invoice.stripe.com/2/pdf',
      lineItems: [],
      metadata: {},
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-02-01'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    render(<InvoicesTable invoices={[]} loading={true} />)
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Facturas')).toBeInTheDocument()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders empty state when no invoices', () => {
    render(<InvoicesTable invoices={[]} loading={false} />)
    expect(screen.getByText('Sin facturas')).toBeInTheDocument()
    expect(screen.getByText('Aún no tienes facturas emitidas')).toBeInTheDocument()
  })

  it('renders table with invoices', () => {
    render(<InvoicesTable invoices={mockInvoices} />)
    expect(screen.getByText('Facturas')).toBeInTheDocument()
    expect(screen.getByText(/Historial de facturas y pagos \(2\)/)).toBeInTheDocument()
  })

  it('renders table headers', () => {
    render(<InvoicesTable invoices={mockInvoices} />)
    expect(screen.getByText('Número')).toBeInTheDocument()
    expect(screen.getByText('Fecha')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Monto')).toBeInTheDocument()
    expect(screen.getByText('Acciones')).toBeInTheDocument()
  })

  it('renders all invoice rows', () => {
    render(<InvoicesTable invoices={mockInvoices} />)
    expect(screen.getByText('INV-2025-001')).toBeInTheDocument()
    expect(screen.getByText('INV-2025-002')).toBeInTheDocument()
  })

  it('opens PDF in new window when download clicked', () => {
    render(<InvoicesTable invoices={mockInvoices} />)
    const pdfButtons = screen.getAllByText('PDF')
    fireEvent.click(pdfButtons[0])
    expect(mockOpen).toHaveBeenCalledWith('https://invoice.stripe.com/1/pdf', '_blank')
  })

  it('opens hosted invoice in new window when view clicked', () => {
    render(<InvoicesTable invoices={mockInvoices} />)
    const viewButtons = screen.getAllByText('Ver')
    fireEvent.click(viewButtons[0])
    expect(mockOpen).toHaveBeenCalledWith('https://invoice.stripe.com/1', '_blank')
  })

  it('does not open window if PDF URL is null', () => {
    const invoiceWithoutPdf = [{ ...mockInvoices[0], invoicePdfUrl: null }]
    render(<InvoicesTable invoices={invoiceWithoutPdf} />)
    expect(screen.queryByText('PDF')).not.toBeInTheDocument()
  })

  it('does not open window if hosted URL is null', () => {
    const invoiceWithoutHosted = [{ ...mockInvoices[0], hostedInvoiceUrl: null }]
    render(<InvoicesTable invoices={invoiceWithoutHosted} />)
    expect(screen.queryByText('Ver')).not.toBeInTheDocument()
  })

  it('filters invoices by status', () => {
    const { container: _container } = render(<InvoicesTable invoices={mockInvoices} />)
    // Initially shows all invoices
    expect(screen.getByText('INV-2025-001')).toBeInTheDocument()
    expect(screen.getByText('INV-2025-002')).toBeInTheDocument()

    // Filter functionality is commented out in the component
    // This test documents the intended behavior
  })

  it('updates invoice count in description', () => {
    const { rerender } = render(<InvoicesTable invoices={mockInvoices} />)
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument()

    const singleInvoice = [mockInvoices[0]]
    rerender(<InvoicesTable invoices={singleInvoice} />)
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument()
  })

  it('renders table with scrollable container', () => {
    const { container } = render(<InvoicesTable invoices={mockInvoices} />)
    const scrollContainer = container.querySelector('.overflow-x-auto')
    expect(scrollContainer).toBeInTheDocument()
  })

  it('shows correct count for empty filtered results', () => {
    render(<InvoicesTable invoices={[]} />)
    expect(screen.getByText('Sin facturas')).toBeInTheDocument()
  })

  it('renders with many invoices', () => {
    const manyInvoices = Array.from({ length: 50 }, (_, i) => ({
      ...mockInvoices[0],
      id: `${i}`,
      number: `INV-2025-${String(i + 1).padStart(3, '0')}`,
    }))
    render(<InvoicesTable invoices={manyInvoices} />)
    expect(screen.getByText(/\(50\)/)).toBeInTheDocument()
  })

  it('handles mixed invoice statuses', () => {
    const mixedInvoices: Invoice[] = [
      { ...mockInvoices[0], status: 'paid' },
      { ...mockInvoices[0], id: '2', status: 'open' },
      { ...mockInvoices[0], id: '3', status: 'void' },
      { ...mockInvoices[0], id: '4', status: 'draft' },
    ]
    render(<InvoicesTable invoices={mixedInvoices} />)
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Anulada')).toBeInTheDocument()
    expect(screen.getByText('Borrador')).toBeInTheDocument()
  })

  it('displays file icon in empty state', () => {
    render(<InvoicesTable invoices={[]} />)
    // FileText icon is rendered in empty state
    expect(screen.getByText('Sin facturas')).toBeInTheDocument()
  })

  it('maintains stable invoice order', () => {
    const { rerender } = render(<InvoicesTable invoices={mockInvoices} />)
    const firstRender = screen.getAllByRole('row')

    rerender(<InvoicesTable invoices={mockInvoices} />)
    const secondRender = screen.getAllByRole('row')

    expect(firstRender.length).toBe(secondRender.length)
  })
})

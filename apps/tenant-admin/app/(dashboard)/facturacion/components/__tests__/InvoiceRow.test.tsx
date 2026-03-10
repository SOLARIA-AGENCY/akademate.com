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
      <table data-oid="nb:zl9b">
        <tbody data-oid="8ab9f0l">
          <InvoiceRow invoice={baseInvoice} data-oid="fc.-_ar" />
        </tbody>
      </table>
    )
    expect(screen.getByText('INV-2025-001')).toBeInTheDocument()
  })

  it('renders formatted date', () => {
    render(
      <table data-oid="ku5j8.z">
        <tbody data-oid="__m95.6">
          <InvoiceRow invoice={baseInvoice} data-oid="4-po.1x" />
        </tbody>
      </table>
    )
    expect(screen.getByText(/15 ene\.? 2025/i)).toBeInTheDocument()
  })

  it('renders paid status correctly', () => {
    render(
      <table data-oid="ks0wbzw">
        <tbody data-oid="ctx0gkg">
          <InvoiceRow invoice={baseInvoice} data-oid="4n_nfx8" />
        </tbody>
      </table>
    )
    expect(screen.getByText('Pagada')).toBeInTheDocument()
  })

  it('renders open status correctly', () => {
    const openInvoice = { ...baseInvoice, status: 'open' as const }
    render(
      <table data-oid="r661pol">
        <tbody data-oid="nnwmp3c">
          <InvoiceRow invoice={openInvoice} data-oid="mg27erd" />
        </tbody>
      </table>
    )
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders void status correctly', () => {
    const voidInvoice = { ...baseInvoice, status: 'void' as const }
    render(
      <table data-oid="_9fib72">
        <tbody data-oid="e-uk1uf">
          <InvoiceRow invoice={voidInvoice} data-oid="50znr_:" />
        </tbody>
      </table>
    )
    expect(screen.getByText('Anulada')).toBeInTheDocument()
  })

  it('renders draft status correctly', () => {
    const draftInvoice = { ...baseInvoice, status: 'draft' as const }
    render(
      <table data-oid="32g-aml">
        <tbody data-oid="o-b6l0r">
          <InvoiceRow invoice={draftInvoice} data-oid="o2.jj0t" />
        </tbody>
      </table>
    )
    expect(screen.getByText('Borrador')).toBeInTheDocument()
  })

  it('renders uncollectible status correctly', () => {
    const uncollectibleInvoice = { ...baseInvoice, status: 'uncollectible' as const }
    render(
      <table data-oid="f-:zyzm">
        <tbody data-oid="0ssn6x9">
          <InvoiceRow invoice={uncollectibleInvoice} data-oid="9wolhvt" />
        </tbody>
      </table>
    )
    expect(screen.getByText('Incobrable')).toBeInTheDocument()
  })

  it('renders formatted amount in EUR', () => {
    render(
      <table data-oid="ufz4qc5">
        <tbody data-oid="r3-l9jo">
          <InvoiceRow invoice={baseInvoice} data-oid="8tdnh.-" />
        </tbody>
      </table>
    )
    expect(screen.getByText(/299,00\s*€/)).toBeInTheDocument()
  })

  it('renders download button when PDF URL exists', () => {
    render(
      <table data-oid="kt8gfrq">
        <tbody data-oid=".t:ur7w">
          <InvoiceRow invoice={baseInvoice} onDownload={mockOnDownload} data-oid="y601.4e" />
        </tbody>
      </table>
    )
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('does not render download button when no PDF URL', () => {
    const noPdfInvoice = { ...baseInvoice, invoicePdfUrl: null }
    render(
      <table data-oid="e4-enpd">
        <tbody data-oid="2mhc2sg">
          <InvoiceRow invoice={noPdfInvoice} onDownload={mockOnDownload} data-oid="kudz2jh" />
        </tbody>
      </table>
    )
    expect(screen.queryByText('PDF')).not.toBeInTheDocument()
  })

  it('renders view button when hosted URL exists', () => {
    render(
      <table data-oid="7hj58hv">
        <tbody data-oid="wh0x4ta">
          <InvoiceRow invoice={baseInvoice} onView={mockOnView} data-oid="8.y4vp1" />
        </tbody>
      </table>
    )
    expect(screen.getByText('Ver')).toBeInTheDocument()
  })

  it('does not render view button when no hosted URL', () => {
    const noHostedUrlInvoice = { ...baseInvoice, hostedInvoiceUrl: null }
    render(
      <table data-oid="db_vdd:">
        <tbody data-oid="eiyhl2w">
          <InvoiceRow invoice={noHostedUrlInvoice} onView={mockOnView} data-oid="j7hq6q." />
        </tbody>
      </table>
    )
    expect(screen.queryByText('Ver')).not.toBeInTheDocument()
  })

  it('calls onDownload when download button clicked', () => {
    render(
      <table data-oid="z4p4ho.">
        <tbody data-oid="tqsve5v">
          <InvoiceRow invoice={baseInvoice} onDownload={mockOnDownload} data-oid="7jxwsg4" />
        </tbody>
      </table>
    )
    const downloadButton = screen.getByText('PDF')
    fireEvent.click(downloadButton)
    expect(mockOnDownload).toHaveBeenCalledWith(baseInvoice)
  })

  it('calls onView when view button clicked', () => {
    render(
      <table data-oid="uz7h50:">
        <tbody data-oid="e0k9mwp">
          <InvoiceRow invoice={baseInvoice} onView={mockOnView} data-oid="3pc3s.q" />
        </tbody>
      </table>
    )
    const viewButton = screen.getByText('Ver')
    fireEvent.click(viewButton)
    expect(mockOnView).toHaveBeenCalledWith(baseInvoice)
  })

  it('does not call onDownload when not provided', () => {
    render(
      <table data-oid="dqmnbkk">
        <tbody data-oid="8l1n6ni">
          <InvoiceRow invoice={baseInvoice} data-oid="0ddpt-o" />
        </tbody>
      </table>
    )
    const downloadButton = screen.getByText('PDF')
    fireEvent.click(downloadButton)
    // Should not throw error
  })

  it('does not call onView when not provided', () => {
    render(
      <table data-oid="p:u1bw0">
        <tbody data-oid="ew1si_y">
          <InvoiceRow invoice={baseInvoice} data-oid="mamcec:" />
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
      <table data-oid="7_hqd3b">
        <tbody data-oid="ulujdsu">
          <InvoiceRow invoice={noDateInvoice} data-oid="ht8koen" />
        </tbody>
      </table>
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('applies hover effect on row', () => {
    const { container } = render(
      <table data-oid="d:hem.0">
        <tbody data-oid="f5n9w1:">
          <InvoiceRow invoice={baseInvoice} data-oid="laeuird" />
        </tbody>
      </table>
    )
    const row = container.querySelector('tr')
    expect(row).toHaveClass('hover:bg-muted/50')
  })

  it('renders different currency amounts correctly', () => {
    const usdInvoice = { ...baseInvoice, currency: 'USD', total: 35000 }
    const { rerender } = render(
      <table data-oid="ooo83ok">
        <tbody data-oid="mup4xk0">
          <InvoiceRow invoice={usdInvoice} data-oid="nue5ksq" />
        </tbody>
      </table>
    )
    expect(screen.getByText(/350[.,]00/)).toBeInTheDocument()

    const gbpInvoice = { ...baseInvoice, currency: 'GBP', total: 25000 }
    rerender(
      <table data-oid="jvucrfa">
        <tbody data-oid="jy-i69y">
          <InvoiceRow invoice={gbpInvoice} data-oid="vz9inxf" />
        </tbody>
      </table>
    )
    expect(screen.getByText(/250[.,]00/)).toBeInTheDocument()
  })

  it('renders large amounts correctly', () => {
    const largeInvoice = { ...baseInvoice, total: 123456789 }
    render(
      <table data-oid="p3scrqq">
        <tbody data-oid="me7s0la">
          <InvoiceRow invoice={largeInvoice} data-oid="7joctbh" />
        </tbody>
      </table>
    )
    expect(screen.getByText(/1\.234\.567,89\s*€/)).toBeInTheDocument()
  })

  it('handles different date formats correctly', () => {
    const decemberInvoice = { ...baseInvoice, createdAt: new Date('2025-12-25') }
    render(
      <table data-oid="d2fw2r.">
        <tbody data-oid="x0-4yps">
          <InvoiceRow invoice={decemberInvoice} data-oid="y5ns-zg" />
        </tbody>
      </table>
    )
    expect(screen.getByText(/25 dic\.? 2025/i)).toBeInTheDocument()
  })
})

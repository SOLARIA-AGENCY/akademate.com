import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableEmpty,
  DataTableSkeleton,
} from '../data-table'
import { Inbox } from 'lucide-react'

describe('DataTable', () => {
  it('renders a complete table structure', () => {
    render(
      <DataTable>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Name</DataTableHead>
            <DataTableHead>Email</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          <DataTableRow>
            <DataTableCell>John Doe</DataTableCell>
            <DataTableCell>john@example.com</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('applies data-table class', () => {
    const { container } = render(
      <DataTable>
        <DataTableBody>
          <DataTableRow>
            <DataTableCell>Test</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>
    )

    const table = container.querySelector('table')
    expect(table).toHaveClass('data-table')
  })
})

describe('DataTableHead', () => {
  it('renders with left alignment by default', () => {
    render(
      <table>
        <thead>
          <tr>
            <DataTableHead>Header</DataTableHead>
          </tr>
        </thead>
      </table>
    )

    expect(screen.getByText('Header')).toHaveClass('text-left')
  })

  it('renders with center alignment', () => {
    render(
      <table>
        <thead>
          <tr>
            <DataTableHead align="center">Header</DataTableHead>
          </tr>
        </thead>
      </table>
    )

    expect(screen.getByText('Header')).toHaveClass('text-center')
  })

  it('renders with right alignment', () => {
    render(
      <table>
        <thead>
          <tr>
            <DataTableHead align="right">Header</DataTableHead>
          </tr>
        </thead>
      </table>
    )

    expect(screen.getByText('Header')).toHaveClass('text-right')
  })
})

describe('DataTableCell', () => {
  it('renders with left alignment by default', () => {
    render(
      <table>
        <tbody>
          <tr>
            <DataTableCell>Cell</DataTableCell>
          </tr>
        </tbody>
      </table>
    )

    expect(screen.getByText('Cell')).toHaveClass('text-left')
  })

  it('renders with right alignment', () => {
    render(
      <table>
        <tbody>
          <tr>
            <DataTableCell align="right">123</DataTableCell>
          </tr>
        </tbody>
      </table>
    )

    expect(screen.getByText('123')).toHaveClass('text-right')
  })

  it('applies numeric styling', () => {
    render(
      <table>
        <tbody>
          <tr>
            <DataTableCell numeric>456</DataTableCell>
          </tr>
        </tbody>
      </table>
    )

    expect(screen.getByText('456')).toHaveClass('tabular-nums')
    expect(screen.getByText('456')).toHaveClass('font-medium')
  })
})

describe('DataTableEmpty', () => {
  it('renders empty state with title', () => {
    render(
      <table>
        <tbody>
          <DataTableEmpty title="No data found" />
        </tbody>
      </table>
    )

    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('renders empty state with description', () => {
    render(
      <table>
        <tbody>
          <DataTableEmpty
            title="No data"
            description="Try adjusting your filters"
          />
        </tbody>
      </table>
    )

    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
  })

  it('renders empty state with icon', () => {
    render(
      <table>
        <tbody>
          <DataTableEmpty
            title="Empty"
            icon={<Inbox data-testid="inbox-icon" />}
          />
        </tbody>
      </table>
    )

    expect(screen.getByTestId('inbox-icon')).toBeInTheDocument()
  })

  it('renders empty state with action', () => {
    render(
      <table>
        <tbody>
          <DataTableEmpty
            title="Empty"
            action={<button>Add Item</button>}
          />
        </tbody>
      </table>
    )

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument()
  })
})

describe('DataTableSkeleton', () => {
  it('renders correct number of rows', () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableSkeleton columns={3} rows={5} />
        </tbody>
      </table>
    )

    const rows = container.querySelectorAll('tr')
    expect(rows.length).toBe(5)
  })

  it('renders correct number of columns', () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableSkeleton columns={4} rows={1} />
        </tbody>
      </table>
    )

    const cells = container.querySelectorAll('td')
    expect(cells.length).toBe(4)
  })

  it('renders skeleton elements', () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableSkeleton columns={2} rows={2} />
        </tbody>
      </table>
    )

    const skeletons = container.querySelectorAll('.skeleton-text')
    expect(skeletons.length).toBe(4)
  })

  it('defaults to 3 rows', () => {
    const { container } = render(
      <table>
        <tbody>
          <DataTableSkeleton columns={2} />
        </tbody>
      </table>
    )

    const rows = container.querySelectorAll('tr')
    expect(rows.length).toBe(3)
  })
})

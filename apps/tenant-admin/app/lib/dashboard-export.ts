'use client'

export interface ExportColumn<TItem> {
  header: string
  getValue: (item: TItem) => unknown
}

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function textValue(value: unknown) {
  return String(value ?? '').trim()
}

export function downloadCsv<TItem>(
  filename: string,
  columns: ExportColumn<TItem>[],
  rows: TItem[]
) {
  const csvRows = [
    columns.map((column) => column.header),
    ...rows.map((row) => columns.map((column) => column.getValue(row))),
  ]
  const csv = csvRows.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function printTable<TItem>(
  title: string,
  columns: ExportColumn<TItem>[],
  rows: TItem[],
  subtitle?: string
) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800')
  if (!printWindow) {
    window.print()
    return
  }

  const headers = columns.map((column) => `<th>${column.header}</th>`).join('')
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${textValue(column.getValue(row)) || '-'}</td>`)
          .join('')}</tr>`
    )
    .join('')

  printWindow.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #111827; margin: 32px; }
    header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f2014b; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 800; letter-spacing: -0.04em; }
    .brand span { color: #f2014b; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    p { margin: 0; color: #6b7280; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; background: #f9fafb; border-bottom: 1px solid #d1d5db; padding: 8px; }
    td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    @page { margin: 18mm; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${title}</h1>
      <p>${subtitle ?? `${rows.length} registros visibles`}</p>
    </div>
    <div class="brand"><span>cep</span> formación</div>
  </header>
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <script>window.print(); window.close();</script>
</body>
</html>`)
  printWindow.document.close()
}

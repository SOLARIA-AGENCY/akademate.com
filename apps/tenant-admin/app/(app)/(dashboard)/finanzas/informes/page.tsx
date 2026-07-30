'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ClipboardList } from 'lucide-react'
import type { FinanceReportRow } from '@/src/domain/financeReporting'

type Report = {
  rows: FinanceReportRow[]
  totals: { income: number; expense: number; net: number; entries: number }
}

const money = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

export default function InformesFinancierosPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/finance/reports', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo cargar el informe financiero')
        return response.json() as Promise<Report>
      })
      .then(setReport)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Error desconocido'))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Informes Financieros" description="Entidad juridica × sede × actividad formativa" icon={ClipboardList} />
      {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
      {!report && !error ? <p className="text-sm text-slate-500">Calculando informe…</p> : null}
      {report ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            {[
              ['Ingresos', money(report.totals.income)], ['Gastos', money(report.totals.expense)],
              ['Resultado', money(report.totals.net)], ['Apuntes', String(report.totals.entries)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
            ))}
          </section>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left"><tr>
                {['Entidad juridica', 'Sede', 'Actividad', 'Ingresos', 'Gastos', 'Resultado', 'Apuntes'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}
              </tr></thead>
              <tbody>
                {report.rows.map((row) => <tr key={row.key} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.legalEntity}</td><td className="px-4 py-3">{row.campus}</td>
                  <td className="px-4 py-3">{row.activity}</td><td className="px-4 py-3">{money(row.income)}</td>
                  <td className="px-4 py-3">{money(row.expense)}</td><td className="px-4 py-3 font-medium">{money(row.net)}</td>
                  <td className="px-4 py-3">{row.entries}</td>
                </tr>)}
                {report.rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No hay apuntes financieros para los ambitos autorizados.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}

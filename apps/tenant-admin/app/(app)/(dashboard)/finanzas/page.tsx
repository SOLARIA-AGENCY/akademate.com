'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { UpcomingPlaceholder } from '@payload-config/components/ui/UpcomingPlaceholder'
import { Landmark } from 'lucide-react'

export default function FinanzasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumen Financiero"
        description="Vision general de ingresos, gastos y rentabilidad"
        icon={Landmark}
      />
      <UpcomingPlaceholder
        title="Resumen Financiero"
        description="Panel centralizado con el estado financiero de tu academia en tiempo real."
        features={[
          'KPIs: ingresos mensuales, gastos, beneficio neto, morosidad',
          'Grafico de flujo de caja (ingresos vs gastos por mes)',
          'Desglose por sede y por tipo de formacion',
          'Alertas de pagos pendientes y vencimientos',
          'Comparativa con periodos anteriores',
        ]}
      />
    </div>
  )
}

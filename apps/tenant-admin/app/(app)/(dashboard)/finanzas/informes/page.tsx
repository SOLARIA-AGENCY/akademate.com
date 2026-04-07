'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { UpcomingPlaceholder } from '@payload-config/components/ui/UpcomingPlaceholder'
import { ClipboardList } from 'lucide-react'

export default function InformesFinancierosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes Financieros"
        description="Reportes y analisis para toma de decisiones"
        icon={ClipboardList}
      />
      <UpcomingPlaceholder
        title="Informes Financieros"
        description="Generacion de informes automaticos para direccion, contabilidad y auditorias."
        features={[
          'Cuenta de resultados mensual/trimestral/anual',
          'Informe de morosidad con detalle por alumno',
          'Rentabilidad por curso, ciclo y sede',
          'Prevision de ingresos (matriculas confirmadas vs estimadas)',
          'Exportacion a Excel y PDF',
          'Informe FUNDAE de bonificaciones',
          'Datos para declaracion fiscal (modelo 347, etc.)',
        ]}
      />
    </div>
  )
}

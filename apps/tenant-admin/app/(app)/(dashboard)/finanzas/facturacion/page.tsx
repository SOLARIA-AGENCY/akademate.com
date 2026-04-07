'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { UpcomingPlaceholder } from '@payload-config/components/ui/UpcomingPlaceholder'
import { Receipt } from 'lucide-react'

export default function FacturacionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturacion"
        description="Emision y gestion de facturas para alumnos y empresas"
        icon={Receipt}
      />
      <UpcomingPlaceholder
        title="Facturacion"
        description="Sistema de facturacion integrado con los datos de matriculas y pagos."
        features={[
          'Generacion automatica de facturas al matricular',
          'Facturas a empresas (FUNDAE, bonificada)',
          'Numeracion secuencial legal (serie + numero)',
          'Descarga en PDF con datos fiscales del centro',
          'Rectificativas y abonos',
          'Exportacion para contabilidad (CSV, formato A3)',
          'Integracion futura con TicketBAI / SII',
        ]}
      />
    </div>
  )
}

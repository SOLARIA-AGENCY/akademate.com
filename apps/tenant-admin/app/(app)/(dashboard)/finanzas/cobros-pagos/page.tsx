'use client'

import { UpcomingPlaceholder } from '@payload-config/components/ui/UpcomingPlaceholder'
import { HandCoins } from 'lucide-react'

export default function CobrosPagosPage() {
  return (
    <div className="space-y-6">

      <UpcomingPlaceholder
        title="Cobros y Pagos"
        description="Control total de los movimientos economicos: cobros a alumnos, pagos a profesores y proveedores."
        features={[
          'Registro de pagos de matricula (efectivo, tarjeta, transferencia, financiacion)',
          'Cobros recurrentes mensuales con estado (pagado, pendiente, vencido)',
          'Pagos a profesores por horas/mes',
          'Pasarela de pago online (Stripe/Redsys)',
          'Recordatorios automaticos de pagos pendientes',
          'Historial completo de transacciones por alumno',
          'Conciliacion bancaria basica',
        ]}
      />
    </div>
  )
}

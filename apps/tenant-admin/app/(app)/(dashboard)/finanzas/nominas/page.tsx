'use client'

import { UpcomingPlaceholder } from '@payload-config/components/ui/UpcomingPlaceholder'
import { PiggyBank } from 'lucide-react'

export default function NominasPage() {
  return (
    <div className="space-y-6">

      <UpcomingPlaceholder
        title="Nominas y Costes"
        description="Control de costes de personal vinculado a profesores, administrativos y convocatorias."
        features={[
          'Coste por profesor (horas asignadas x tarifa)',
          'Coste por convocatoria (profesores + aula + materiales)',
          'Margen de rentabilidad por curso/ciclo',
          'Resumen mensual de costes de personal',
          'Costes fijos de sede (alquiler, suministros)',
          'Proyeccion de gastos por trimestre',
        ]}
      />
    </div>
  )
}

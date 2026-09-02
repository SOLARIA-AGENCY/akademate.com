'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@payload-config/components/ui/empty'
import { Infinity as InfinityIcon } from 'lucide-react'

export default function NuevaFormacionContinuaPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Nueva formación continua" icon={InfinityIcon} />
      <Empty className="min-h-[16rem]">
        <EmptyHeader>
          <EmptyTitle>Alta pendiente de esquema</EmptyTitle>
          <EmptyDescription>
            El listado ya está listo. Crear registros espera a que exista la tabla
            `continuous-trainings` (PAYLOAD_DB_PUSH o migración autorizada).
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}

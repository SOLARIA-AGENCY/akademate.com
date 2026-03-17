'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { FileInput } from 'lucide-react'

export default function FormulariosPage() {
  return (
    <div className="space-y-4" data-oid="414.d1m">
      <PageHeader
        title="Formularios"
        description="Gestión de formularios web y captura de leads"
        icon={FileInput}
        data-oid="ujrxclv"
      />

      <Card data-oid="xd0ec7.">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="k0i4x-v"
        >
          <p className="text-muted-foreground text-sm" data-oid="jq5_cud">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

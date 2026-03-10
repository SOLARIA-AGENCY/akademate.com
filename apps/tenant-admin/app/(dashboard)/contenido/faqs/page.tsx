'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { HelpCircle } from 'lucide-react'

export default function FaqsPage() {
  return (
    <div className="space-y-4" data-oid="0m.:_nl">
      <PageHeader
        title="FAQs"
        description="Gestión de preguntas frecuentes"
        icon={HelpCircle}
        data-oid="d6.neql"
      />

      <Card data-oid="ol_7wt_">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="c0xxwql"
        >
          <p className="text-muted-foreground text-sm" data-oid="vk64r:r">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

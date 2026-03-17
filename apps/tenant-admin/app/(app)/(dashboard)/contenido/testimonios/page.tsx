'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { MessageSquareQuote } from 'lucide-react'

export default function TestimoniosPage() {
  return (
    <div className="space-y-4" data-oid="4r.2i4t">
      <PageHeader
        title="Testimonios"
        description="Gestión de testimonios y reseñas de alumnos"
        icon={MessageSquareQuote}
        data-oid="o.:9p3x"
      />

      <Card data-oid="es1i1v:">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="ggbfv0c"
        >
          <p className="text-muted-foreground text-sm" data-oid="x6n0qcm">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

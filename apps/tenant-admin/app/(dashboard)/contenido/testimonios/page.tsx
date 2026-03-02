'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { MessageSquareQuote } from 'lucide-react'

export default function TestimoniosPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Testimonios"
        description="Gestión de testimonios y reseñas de alumnos"
        icon={MessageSquareQuote}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No hay contenido disponible todavía.</p>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Newspaper } from 'lucide-react'

export default function BlogPage() {
  return (
    <div className="space-y-4" data-oid="yag4by_">
      <PageHeader
        title="Blog / Noticias"
        description="Gestión de artículos y noticias del sitio web"
        icon={Newspaper}
        data-oid="w-5n59a"
      />

      <Card data-oid="mbo.qp.">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="fol2ydf"
        >
          <p className="text-muted-foreground text-sm" data-oid="l:8ykrp">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

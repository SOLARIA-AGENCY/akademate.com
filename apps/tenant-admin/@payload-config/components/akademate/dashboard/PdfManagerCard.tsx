'use client'

import * as React from 'react'
import { Download, FileText, Upload } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'

export interface PdfManagerCardProps {
  title?: string
  description?: string
  pdfUrl?: string | null
  pdfName?: string | null
  onUpload?: () => void
  onReplace?: () => void
  className?: string
}

export function PdfManagerCard({
  title = 'PDF del programa',
  description = 'Documento operativo del curso para impresión, descarga y actualización.',
  pdfUrl,
  pdfName,
  onUpload,
  onReplace,
  className,
}: PdfManagerCardProps) {
  const hasPdf = Boolean(pdfUrl)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText data-icon="inline-start" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasPdf ? (
          <div className="rounded-xl border bg-muted/35 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{pdfName || 'Dossier del curso'}</p>
                <p className="mt-1 text-sm text-muted-foreground">Última versión cargada en la ficha.</p>
              </div>
              <FileText className="size-5 shrink-0 text-primary" />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/25 p-4">
            <p className="font-medium text-foreground">PDF del programa no disponible todavía.</p>
            <p className="mt-1 text-sm text-muted-foreground">Sube un documento para que el equipo pueda descargarlo desde la ficha.</p>
          </div>
        )}

        <div className={cn('grid gap-2', hasPdf && onReplace ? 'sm:grid-cols-2' : 'sm:grid-cols-1')}>
          {hasPdf ? (
            <Button asChild>
              <a href={pdfUrl || '#'} target="_blank" rel="noopener noreferrer">
                <Download data-icon="inline-start" />
                Descargar PDF
              </a>
            </Button>
          ) : null}
          {hasPdf && onReplace ? (
            <Button type="button" variant="outline" onClick={onReplace}>
              <Upload data-icon="inline-start" />
              Sustituir PDF
            </Button>
          ) : null}
          {!hasPdf && onUpload ? (
            <Button type="button" onClick={onUpload}>
              <Upload data-icon="inline-start" />
              Subir PDF
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { Download, FileText, Upload } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export interface DocumentCardProps {
  title?: string
  description?: string
  fileName?: string
  fileUrl?: string | null
  downloadName?: string
  onUpload?: () => void
  onReplace?: () => void
}

export function DocumentCard({
  title = 'PDF del programa',
  description = 'Documento operativo del curso para impresión, descarga y actualización.',
  fileName = 'Dossier del curso',
  fileUrl,
  downloadName,
  onUpload,
  onReplace,
}: DocumentCardProps) {
  const hasFile = Boolean(fileUrl)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="size-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="font-semibold text-foreground">{hasFile ? fileName : 'PDF no disponible'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFile ? 'Última versión cargada en la ficha.' : 'Sube el dossier cuando esté preparado.'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {hasFile ? (
            <Button asChild>
              <a href={fileUrl ?? '#'} download={downloadName}>
                <Download data-icon="inline-start" />
                Descargar PDF
              </a>
            </Button>
          ) : (
            <Button type="button" onClick={onUpload}>
              <Upload data-icon="inline-start" />
              Subir PDF
            </Button>
          )}
          <Button type="button" variant="outline" onClick={hasFile ? onReplace : onUpload}>
            <Upload data-icon="inline-start" />
            {hasFile ? 'Sustituir PDF' : 'Seleccionar archivo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

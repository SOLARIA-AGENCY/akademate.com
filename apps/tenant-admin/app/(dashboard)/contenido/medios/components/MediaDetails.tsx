'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@payload-config/components/ui/alert-dialog'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Badge } from '@payload-config/components/ui/badge'
import { Separator } from '@payload-config/components/ui/separator'
import {
  Copy,
  Download,
  Trash2,
  Calendar,
  HardDrive,
  FileImage,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@payload-config/hooks/use-toast'
import type { ChangeEvent } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { MediaItem } from './MediaGallery'

/** Toast configuration options */
interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

/** Toast function type */
type ToastFunction = (options: ToastOptions) => void

/** Toast hook result */
interface ToastHookResult {
  toast: ToastFunction
}

interface MediaDetailsProps {
  item: MediaItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (id: string, data: Partial<MediaItem>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function MediaDetails({
  item,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: MediaDetailsProps) {
  const [altText, setAltText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
   
  const { toast } = useToast() as unknown as ToastHookResult

  // Update alt text when item changes
  useState(() => {
    if (item) {
      setAltText(item.alt)
    }
  })

  if (!item) return null

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.url)
      toast({
        title: 'URL copiada',
        description: 'La URL se ha copiado al portapapeles',
      })
    } catch {
      toast({
        title: 'Error al copiar',
        description: 'No se pudo copiar la URL',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = item.url
    link.download = item.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Descarga iniciada',
      description: `Descargando ${item.filename}`,
    })
  }

  const handleSaveAlt = async () => {
    if (!onUpdate) return

    setIsSaving(true)
    try {
      await onUpdate(item.id, { alt: altText })
      setIsEditing(false)
      toast({
        title: 'Guardado',
        description: 'El texto alternativo se ha actualizado correctamente',
      })
    } catch (error) {
      toast({
        title: 'Error al guardar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(item.id)
      setShowDeleteDialog(false)
      onOpenChange(false)
      toast({
        title: 'Eliminado',
        description: 'El archivo se ha eliminado correctamente',
      })
    } catch (error) {
      toast({
        title: 'Error al eliminar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del archivo</DialogTitle>
            <DialogDescription>
              Información y configuración del archivo multimedia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Image Preview */}
            <div className="rounded-lg border overflow-hidden bg-muted">
              <img
                src={item.url}
                alt={item.alt}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>

            {/* File Info Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nombre del archivo</Label>
                <p className="font-medium break-all">{item.filename}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipo de archivo</Label>
                <div>
                  <Badge variant="secondary">
                    {item.mimeType.split('/')[1]?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Tamaño
                </Label>
                <p className="font-medium">{formatFileSize(item.filesize)}</p>
              </div>

              {item.width && item.height && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileImage className="h-3 w-3" />
                    Dimensiones
                  </Label>
                  <p className="font-medium">{item.width} × {item.height} px</p>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Fecha de creación
                </Label>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Última modificación
                </Label>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(item.updatedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Alt Text Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="alt-text">Texto alternativo</Label>
                {!isEditing && onUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true)
                      setAltText(item.alt)
                    }}
                  >
                    Editar
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    id="alt-text"
                    value={altText}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAltText(e.target.value)}
                    placeholder="Describe la imagen para accesibilidad"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false)
                        setAltText(item.alt)
                      }}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAlt}
                      disabled={isSaving || altText === item.alt}
                      style={{ backgroundColor: altText !== item.alt && !isSaving ? '#F2014B' : undefined }}
                    >
                      {isSaving ? (
                        'Guardando...'
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {item.alt || 'Sin texto alternativo'}
                </p>
              )}
            </div>

            <Separator />

            {/* URL Section */}
            <div className="space-y-2">
              <Label>URL del archivo</Label>
              <div className="flex gap-2">
                <Input
                  value={item.url}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title="Copiar URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(item.url, '_blank')}
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Available Sizes */}
            {item.sizes && Object.keys(item.sizes).length > 0 && (
              <div className="space-y-2">
                <Label>Tamaños disponibles</Label>
                <div className="grid gap-2">
                  {Object.entries(item.sizes).map(([sizeName, sizeData]) => (
                    <div
                      key={sizeName}
                      className="flex items-center justify-between p-2 rounded border text-sm"
                    >
                      <div>
                        <span className="font-medium capitalize">{sizeName}</span>
                        <span className="text-muted-foreground ml-2">
                          ({sizeData.width}×{sizeData.height}px)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(sizeData.url)
                            toast({
                              title: 'URL copiada',
                              description: `URL de tamaño ${sizeName} copiada`,
                            })
                          } catch {
                            toast({
                              title: 'Error',
                              description: 'No se pudo copiar la URL',
                              variant: 'destructive',
                            })
                          }
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo "{item.filename}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

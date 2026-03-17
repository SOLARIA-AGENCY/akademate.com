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

export function MediaDetails({ item, open, onOpenChange, onUpdate, onDelete }: MediaDetailsProps) {
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
      <Dialog open={open} onOpenChange={onOpenChange} data-oid="q69lb7t">
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-oid="kh4xz3n">
          <DialogHeader data-oid="gz.zkn:">
            <DialogTitle data-oid="e_66cbj">Detalles del archivo</DialogTitle>
            <DialogDescription data-oid="k2p.o.n">
              Información y configuración del archivo multimedia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4" data-oid="h:qhvok">
            {/* Image Preview */}
            <div className="rounded-lg border overflow-hidden bg-muted" data-oid="jq2ebg0">
              <img
                src={item.url}
                alt={item.alt}
                className="w-full h-auto max-h-96 object-contain"
                data-oid="vrsejky"
              />
            </div>

            {/* File Info Grid */}
            <div className="grid gap-4 md:grid-cols-2" data-oid="_yo:6wl">
              <div className="space-y-1" data-oid="4w1rm-z">
                <Label className="text-xs text-muted-foreground" data-oid="pz7b94u">
                  Nombre del archivo
                </Label>
                <p className="font-medium break-all" data-oid="_i9g6m.">
                  {item.filename}
                </p>
              </div>

              <div className="space-y-1" data-oid="q204vel">
                <Label className="text-xs text-muted-foreground" data-oid="v3l7_yh">
                  Tipo de archivo
                </Label>
                <div data-oid="8mxazkw">
                  <Badge variant="secondary" data-oid="2p-9eb_">
                    {item.mimeType.split('/')[1]?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1" data-oid="4a32we_">
                <Label
                  className="text-xs text-muted-foreground flex items-center gap-1"
                  data-oid="5e5b207"
                >
                  <HardDrive className="h-3 w-3" data-oid="2cxkbzt" />
                  Tamaño
                </Label>
                <p className="font-medium" data-oid="_3nfumj">
                  {formatFileSize(item.filesize)}
                </p>
              </div>

              {item.width && item.height && (
                <div className="space-y-1" data-oid="of-j.od">
                  <Label
                    className="text-xs text-muted-foreground flex items-center gap-1"
                    data-oid="g6ng6ei"
                  >
                    <FileImage className="h-3 w-3" data-oid="lv5u1x2" />
                    Dimensiones
                  </Label>
                  <p className="font-medium" data-oid="nk:4w-2">
                    {item.width} × {item.height} px
                  </p>
                </div>
              )}

              <div className="space-y-1" data-oid="gl8z1xl">
                <Label
                  className="text-xs text-muted-foreground flex items-center gap-1"
                  data-oid="sgv67bx"
                >
                  <Calendar className="h-3 w-3" data-oid="-m11o22" />
                  Fecha de creación
                </Label>
                <p className="font-medium" data-oid="usvnpo9">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>

              <div className="space-y-1" data-oid="msn7c-8">
                <Label
                  className="text-xs text-muted-foreground flex items-center gap-1"
                  data-oid="t9xtsgc"
                >
                  <Calendar className="h-3 w-3" data-oid="elm2f02" />
                  Última modificación
                </Label>
                <p className="font-medium" data-oid="8mww59:">
                  {formatDistanceToNow(new Date(item.updatedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            <Separator data-oid="g2rj6hl" />

            {/* Alt Text Section */}
            <div className="space-y-3" data-oid="ryhq3wj">
              <div className="flex items-center justify-between" data-oid="fbqqga4">
                <Label htmlFor="alt-text" data-oid="qsycxh4">
                  Texto alternativo
                </Label>
                {!isEditing && onUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true)
                      setAltText(item.alt)
                    }}
                    data-oid="1d9m289"
                  >
                    Editar
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3" data-oid="wsxp13j">
                  <Input
                    id="alt-text"
                    value={altText}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAltText(e.target.value)}
                    placeholder="Describe la imagen para accesibilidad"
                    data-oid="xn_60z7"
                  />

                  <div className="flex gap-2 justify-end" data-oid="s2l8c9c">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false)
                        setAltText(item.alt)
                      }}
                      disabled={isSaving}
                      data-oid="lzo3q:x"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAlt}
                      disabled={isSaving || altText === item.alt}
                      style={{
                        backgroundColor: altText !== item.alt && !isSaving ? '#F2014B' : undefined,
                      }}
                      data-oid="ngses:k"
                    >
                      {isSaving ? (
                        'Guardando...'
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" data-oid="kag32b7" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-oid="ka3vkb2">
                  {item.alt || 'Sin texto alternativo'}
                </p>
              )}
            </div>

            <Separator data-oid="o:gche4" />

            {/* URL Section */}
            <div className="space-y-2" data-oid="b5_e0n-">
              <Label data-oid="bpgl87s">URL del archivo</Label>
              <div className="flex gap-2" data-oid="7:w4koh">
                <Input value={item.url} readOnly className="font-mono text-sm" data-oid="bem70yh" />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title="Copiar URL"
                  data-oid="8k.pn9k"
                >
                  <Copy className="h-4 w-4" data-oid="sy_8ecu" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(item.url, '_blank')}
                  title="Abrir en nueva pestaña"
                  data-oid="13o0avf"
                >
                  <ExternalLink className="h-4 w-4" data-oid="tneit6z" />
                </Button>
              </div>
            </div>

            {/* Available Sizes */}
            {item.sizes && Object.keys(item.sizes).length > 0 && (
              <div className="space-y-2" data-oid="6nrgdro">
                <Label data-oid="b3zegum">Tamaños disponibles</Label>
                <div className="grid gap-2" data-oid="afduddr">
                  {Object.entries(item.sizes).map(([sizeName, sizeData]) => (
                    <div
                      key={sizeName}
                      className="flex items-center justify-between p-2 rounded border text-sm"
                      data-oid="25b6spf"
                    >
                      <div data-oid="jqw2hz.">
                        <span className="font-medium capitalize" data-oid="tqno4pt">
                          {sizeName}
                        </span>
                        <span className="text-muted-foreground ml-2" data-oid="dceckbe">
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
                        data-oid="jpep.k5"
                      >
                        <Copy className="h-3 w-3 mr-1" data-oid="clx:55y" />
                        Copiar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2" data-oid="qetpcsg">
            <div className="flex gap-2 flex-1" data-oid="2godecb">
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  data-oid="vay61ji"
                >
                  <Trash2 className="mr-2 h-4 w-4" data-oid="o75.x-b" />
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex gap-2" data-oid="952-g.o">
              <Button variant="outline" onClick={handleDownload} data-oid="i:pf967">
                <Download className="mr-2 h-4 w-4" data-oid="5bfz6ux" />
                Descargar
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} data-oid="q7hid-f">
                Cerrar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} data-oid="t5pwry:">
        <AlertDialogContent data-oid="5frp30c">
          <AlertDialogHeader data-oid="-70nwsi">
            <AlertDialogTitle data-oid="35s9syk">¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription data-oid="b-qa6xl">
              Esta acción no se puede deshacer. El archivo "{item.filename}" será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="1zvk-j_">
            <AlertDialogCancel disabled={isDeleting} data-oid="4sh:p8y">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-oid="0ltuznc"
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

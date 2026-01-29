'use client'

import { useState, useRef, useCallback } from 'react'
import { Card } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Progress } from '@payload-config/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@payload-config/hooks/use-toast'

interface FileWithPreview {
  file: File
  preview: string
  alt: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface MediaUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
  maxSize?: number // in bytes
}

export function MediaUpload({
  open,
  onOpenChange,
  onUploadComplete,
  maxSize = 5 * 1024 * 1024, // 5MB default
}: MediaUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return 'Solo se permiten archivos de imagen'
    }

    // Check file size
    if (file.size > maxSize) {
      return `El archivo excede el tamaño máximo de ${formatFileSize(maxSize)}`
    }

    return null
  }

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return

    const newFiles: FileWithPreview[] = []

    Array.from(fileList).forEach((file) => {
      const error = validateFile(file)

      if (error) {
        toast({
          title: 'Error al cargar archivo',
          description: `${file.name}: ${error}`,
          variant: 'destructive',
        })
        return
      }

      const preview = URL.createObjectURL(file)
      newFiles.push({
        file,
        preview,
        alt: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        progress: 0,
        status: 'pending',
      })
    })

    setFiles((prev) => [...prev, ...newFiles])
  }, [maxSize, toast])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [handleFiles]
  )

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const file = newFiles[index]
      if (file) {
        URL.revokeObjectURL(file.preview)
        newFiles.splice(index, 1)
      }
      return newFiles
    })
  }

  const updateAlt = (index: number, alt: string) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const file = newFiles[index]
      if (file) {
        file.alt = alt
      }
      return newFiles
    })
  }

  const uploadFiles = async () => {
    const filesToUpload = files.filter((f) => f.status === 'pending')

    if (filesToUpload.length === 0) {
      toast({
        title: 'Sin archivos para subir',
        description: 'Todos los archivos ya han sido procesados',
      })
      return
    }

    for (let i = 0; i < files.length; i++) {
      const fileWithPreview = files[i]
      if (fileWithPreview?.status !== 'pending') continue

      try {
        // Update status to uploading
        setFiles((prev) => {
          const newFiles = [...prev]
          const current = newFiles[i]
          if (current) {
            current.status = 'uploading'
          }
          return newFiles
        })

        const formData = new FormData()
        formData.append('file', fileWithPreview.file)
        formData.append('alt', fileWithPreview.alt)

        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles((prev) => {
            const newFiles = [...prev]
            const current = newFiles[i]
            if (current && current.progress < 90) {
              current.progress += 10
            }
            return newFiles
          })
        }, 200)

        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          throw new Error('Error al subir archivo')
        }

        // Success
        setFiles((prev) => {
          const newFiles = [...prev]
          const current = newFiles[i]
          if (current) {
            current.status = 'success'
            current.progress = 100
          }
          return newFiles
        })
      } catch (error) {
        // Error
        setFiles((prev) => {
          const newFiles = [...prev]
          const current = newFiles[i]
          if (current) {
            current.status = 'error'
            current.error = error instanceof Error ? error.message : 'Error desconocido'
          }
          return newFiles
        })

        toast({
          title: 'Error al subir',
          description: `${fileWithPreview.file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          variant: 'destructive',
        })
      }
    }

    // Check if all uploads completed
    const allCompleted = files.every((f) => f.status === 'success' || f.status === 'error')
    if (allCompleted) {
      const successCount = files.filter((f) => f.status === 'success').length
      if (successCount > 0) {
        toast({
          title: 'Subida completada',
          description: `${successCount} archivo(s) subido(s) correctamente`,
        })
        onUploadComplete?.()

        // Close dialog after 1 second
        setTimeout(() => {
          handleClose()
        }, 1000)
      }
    }
  }

  const handleClose = () => {
    // Cleanup previews
    files.forEach((f) => URL.revokeObjectURL(f.preview))
    setFiles([])
    onOpenChange(false)
  }

  const hasFiles = files.length > 0
  const isUploading = files.some((f) => f.status === 'uploading')
  const canUpload = files.some((f) => f.status === 'pending')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Archivos</DialogTitle>
          <DialogDescription>
            Arrastra y suelta tus imágenes o selecciónalas manualmente. Tamaño máximo: {formatFileSize(maxSize)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  Arrastra y suelta tus imágenes aquí
                </p>
                <p className="text-sm text-muted-foreground">
                  o haz clic para seleccionar archivos
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF, SVG hasta {formatFileSize(maxSize)}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />

          {/* File Previews */}
          {hasFiles && (
            <div className="space-y-3">
              <h3 className="font-medium">Archivos seleccionados ({files.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {files.map((fileWithPreview, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex gap-4">
                      {/* Preview */}
                      <div className="h-20 w-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <img
                          src={fileWithPreview.preview}
                          alt={fileWithPreview.alt}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" title={fileWithPreview.file.name}>
                              {fileWithPreview.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(fileWithPreview.file.size)}
                            </p>
                          </div>
                          {fileWithPreview.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={isUploading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          {fileWithPreview.status === 'success' && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                          {fileWithPreview.status === 'error' && (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>

                        {/* Alt Text Input */}
                        <div className="space-y-1">
                          <Label htmlFor={`alt-${index}`} className="text-xs">
                            Texto alternativo
                          </Label>
                          <Input
                            id={`alt-${index}`}
                            value={fileWithPreview.alt}
                            onChange={(e) => updateAlt(index, e.target.value)}
                            placeholder="Describe la imagen"
                            disabled={fileWithPreview.status !== 'pending'}
                            className="h-8"
                          />
                        </div>

                        {/* Progress Bar */}
                        {fileWithPreview.status === 'uploading' && (
                          <div className="space-y-1">
                            <Progress value={fileWithPreview.progress} className="h-1" />
                            <p className="text-xs text-muted-foreground">
                              Subiendo... {fileWithPreview.progress}%
                            </p>
                          </div>
                        )}

                        {/* Error Message */}
                        {fileWithPreview.status === 'error' && fileWithPreview.error && (
                          <p className="text-xs text-destructive">{fileWithPreview.error}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={!canUpload || isUploading}
            style={{ backgroundColor: canUpload && !isUploading ? '#F2014B' : undefined }}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Subiendo...' : `Subir ${files.filter((f) => f.status === 'pending').length} archivo(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

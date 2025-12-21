/**
 * @fileoverview Drag-and-drop file uploader component
 * Supports multiple file selection, progress tracking, and validation
 */

'use client'

import React, { useCallback, useState, useRef } from 'react'

export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  url: string
  size: number
  type: string
  uploadedAt: string
}

export interface FileUploaderProps {
  onUpload: (files: UploadedFile[]) => void
  onError?: (error: string) => void
  accept?: string[]
  maxSize?: number // MB
  maxFiles?: number
  folder?: string
  className?: string
}

interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
  result?: UploadedFile
}

const DEFAULT_ACCEPT = ['image/*', 'application/pdf', 'video/*', 'audio/*']
const DEFAULT_MAX_SIZE = 50 // MB
const DEFAULT_MAX_FILES = 10

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get file icon based on MIME type
 */
function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️'
  if (type.startsWith('video/')) return '🎬'
  if (type.startsWith('audio/')) return '🎵'
  if (type === 'application/pdf') return '📕'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
  if (type.includes('powerpoint') || type.includes('presentation')) return '📽️'
  return '📄'
}

export function FileUploader({
  onUpload,
  onError,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  folder,
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      // Size check
      if (file.size > maxSize * 1024 * 1024) {
        return `El archivo excede el limite de ${maxSize}MB`
      }

      // Type check
      const isAccepted = accept.some(pattern => {
        if (pattern.endsWith('/*')) {
          return file.type.startsWith(pattern.replace('/*', '/'))
        }
        return file.type === pattern || file.name.endsWith(pattern.replace('*.', '.'))
      })

      if (!isAccepted) {
        return 'Tipo de archivo no permitido'
      }

      return null
    },
    [accept, maxSize]
  )

  const uploadFile = useCallback(
    async (file: File, index: number): Promise<UploadedFile | null> => {
      const formData = new FormData()
      formData.append('file', file)
      if (folder) formData.append('folder', folder)

      try {
        setUploads(prev =>
          prev.map((u, i) => (i === index ? { ...u, status: 'uploading', progress: 0 } : u))
        )

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Error al subir archivo')
        }

        const result = await response.json()

        setUploads(prev =>
          prev.map((u, i) =>
            i === index ? { ...u, status: 'complete', progress: 100, result } : u
          )
        )

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        setUploads(prev =>
          prev.map((u, i) =>
            i === index ? { ...u, status: 'error', error: errorMessage } : u
          )
        )
        return null
      }
    },
    [folder]
  )

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, maxFiles)

      if (fileArray.length === 0) return

      // Validate all files first
      const validFiles: File[] = []
      for (const file of fileArray) {
        const error = validateFile(file)
        if (error) {
          onError?.(error + `: ${file.name}`)
        } else {
          validFiles.push(file)
        }
      }

      if (validFiles.length === 0) return

      // Initialize upload progress
      const newUploads: UploadProgress[] = validFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending',
      }))

      setUploads(prev => [...prev, ...newUploads])

      // Upload files
      const startIndex = uploads.length
      const results: UploadedFile[] = []

      for (let i = 0; i < validFiles.length; i++) {
        const result = await uploadFile(validFiles[i], startIndex + i)
        if (result) results.push(result)
      }

      if (results.length > 0) {
        onUpload(results)
      }
    },
    [maxFiles, validateFile, uploadFile, uploads.length, onUpload, onError]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files?.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'complete'))
  }, [])

  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-8
          transition-colors duration-200
          ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">{isDragging ? '📥' : '📤'}</div>
          <div>
            <p className="font-medium">
              {isDragging ? 'Suelta los archivos aqui' : 'Arrastra archivos aqui'}
            </p>
            <p className="text-sm text-muted-foreground">
              o haz clic para seleccionar
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Max {maxSize}MB por archivo. Hasta {maxFiles} archivos.
          </p>
        </div>
      </div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Archivos</h4>
            {uploads.some(u => u.status === 'complete') && (
              <button
                onClick={clearCompleted}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar completados
              </button>
            )}
          </div>

          {uploads.map((upload, index) => (
            <div
              key={`${upload.file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span className="text-2xl">{getFileIcon(upload.file.type)}</span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{upload.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(upload.file.size)}
                </p>

                {upload.status === 'uploading' && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {upload.status === 'error' && (
                  <p className="mt-1 text-xs text-destructive">{upload.error}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {upload.status === 'uploading' && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
                {upload.status === 'complete' && (
                  <span className="text-lg text-green-500">✓</span>
                )}
                {upload.status === 'error' && (
                  <span className="text-lg text-destructive">✗</span>
                )}
                {upload.status !== 'uploading' && (
                  <button
                    onClick={() => removeUpload(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUploader

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
      const isAccepted = accept.some((pattern) => {
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
        setUploads((prev) =>
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

        setUploads((prev) =>
          prev.map((u, i) =>
            i === index ? { ...u, status: 'complete', progress: 100, result } : u
          )
        )

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        setUploads((prev) =>
          prev.map((u, i) => (i === index ? { ...u, status: 'error', error: errorMessage } : u))
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
      const newUploads: UploadProgress[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: 'pending',
      }))

      setUploads((prev) => [...prev, ...newUploads])

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
    setUploads((prev) => prev.filter((u) => u.status !== 'complete'))
  }, [])

  const removeUpload = useCallback((index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div className={className} data-oid=":vb-ysy">
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
        data-oid="bt2cj_z"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          data-oid=".5e7o3j"
        />

        <div className="flex flex-col items-center gap-3 text-center" data-oid="kpi4rys">
          <div className="text-4xl" data-oid="ou16mgj">
            {isDragging ? '📥' : '📤'}
          </div>
          <div data-oid="9b4wu55">
            <p className="font-medium" data-oid="3rl1cvf">
              {isDragging ? 'Suelta los archivos aqui' : 'Arrastra archivos aqui'}
            </p>
            <p className="text-sm text-muted-foreground" data-oid="_bss59q">
              o haz clic para seleccionar
            </p>
          </div>
          <p className="text-xs text-muted-foreground" data-oid="b5:s9wp">
            Max {maxSize}MB por archivo. Hasta {maxFiles} archivos.
          </p>
        </div>
      </div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2" data-oid="gnsnb_g">
          <div className="flex items-center justify-between" data-oid="w29ty38">
            <h4 className="text-sm font-medium" data-oid="ao4lm93">
              Archivos
            </h4>
            {uploads.some((u) => u.status === 'complete') && (
              <button
                onClick={clearCompleted}
                className="text-xs text-muted-foreground hover:text-foreground"
                data-oid="d6lbrdo"
              >
                Limpiar completados
              </button>
            )}
          </div>

          {uploads.map((upload, index) => (
            <div
              key={`${upload.file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              data-oid="we6.ck0"
            >
              <span className="text-2xl" data-oid="lvsfqfv">
                {getFileIcon(upload.file.type)}
              </span>

              <div className="min-w-0 flex-1" data-oid="981gwoo">
                <p className="truncate text-sm font-medium" data-oid="n7gv7.x">
                  {upload.file.name}
                </p>
                <p className="text-xs text-muted-foreground" data-oid="5sns9q:">
                  {formatFileSize(upload.file.size)}
                </p>

                {upload.status === 'uploading' && (
                  <div
                    className="mt-1 h-1 overflow-hidden rounded-full bg-muted"
                    data-oid="4tbx012"
                  >
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${upload.progress}%` }}
                      data-oid="kc29ybg"
                    />
                  </div>
                )}

                {upload.status === 'error' && (
                  <p className="mt-1 text-xs text-destructive" data-oid="egb4tlu">
                    {upload.error}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2" data-oid="1nh:iug">
                {upload.status === 'uploading' && (
                  <div
                    className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                    data-oid="li4_i.m"
                  />
                )}
                {upload.status === 'complete' && (
                  <span className="text-lg text-green-500" data-oid="d180a.v">
                    ✓
                  </span>
                )}
                {upload.status === 'error' && (
                  <span className="text-lg text-destructive" data-oid="jxieb78">
                    ✗
                  </span>
                )}
                {upload.status !== 'uploading' && (
                  <button
                    onClick={() => removeUpload(index)}
                    className="text-muted-foreground hover:text-destructive"
                    data-oid="5by75mz"
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

'use client'

import { useState } from 'react'
import { Card } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Skeleton } from '@payload-config/components/ui/skeleton'
import { Grid3x3, List, Image as ImageIcon, FileImage, Calendar, HardDrive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export interface MediaItem {
  id: string
  filename: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  alt: string
  url: string
  thumbnailURL?: string
  sizes?: {
    thumbnail?: { url: string; width: number; height: number }
    card?: { url: string; width: number; height: number }
    hero?: { url: string; width: number; height: number }
  }
  createdAt: string
  updatedAt: string
}

interface MediaGalleryProps {
  items: MediaItem[]
  loading?: boolean
  onItemClick?: (item: MediaItem) => void
  selectedId?: string
}

export function MediaGallery({ items, loading = false, onItemClick, selectedId }: MediaGalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (loading) {
    return (
      <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-3 lg:grid-cols-4' : 'space-y-3'}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            {viewMode === 'grid' ? (
              <>
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </>
            ) : (
              <div className="flex gap-4 p-3">
                <Skeleton className="h-20 w-20 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-muted p-6">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No hay archivos</h3>
            <p className="text-sm text-muted-foreground">
              Sube tu primera imagen para empezar
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`
                group cursor-pointer overflow-hidden transition-all hover:shadow-lg
                ${selectedId === item.id ? 'ring-2 ring-primary' : ''}
              `}
              onClick={() => onItemClick?.(item)}
            >
              <div className="aspect-square relative overflow-hidden bg-muted">
                <img
                  src={item.sizes?.thumbnail?.url || item.thumbnailURL || item.url}
                  alt={item.alt}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {getFileExtension(item.mimeType)}
                  </Badge>
                </div>
              </div>
              <div className="p-3 space-y-1">
                <p className="font-medium text-sm truncate" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <HardDrive className="h-3 w-3" />
                  <span>{formatFileSize(item.filesize)}</span>
                  {item.width && item.height && (
                    <>
                      <span>•</span>
                      <span>{item.width}×{item.height}</span>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`
                cursor-pointer transition-all hover:shadow-md
                ${selectedId === item.id ? 'ring-2 ring-primary' : ''}
              `}
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="h-20 w-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                  <img
                    src={item.sizes?.thumbnail?.url || item.thumbnailURL || item.url}
                    alt={item.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" title={item.filename}>
                        {item.filename}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1" title={item.alt}>
                        {item.alt}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {getFileExtension(item.mimeType)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      <span>{formatFileSize(item.filesize)}</span>
                    </div>
                    {item.width && item.height && (
                      <div className="flex items-center gap-1">
                        <FileImage className="h-3 w-3" />
                        <span>{item.width}×{item.height}px</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  // Don't show decimals for bytes
  if (i === 0) return `${Math.floor(value)} ${sizes[i]}`

  const formatted = value.toFixed(1)
  // Keep decimals for MB/GB, remove trailing .0 for KB
  if (i >= 2) return `${formatted} ${sizes[i]}`
  return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted} ${sizes[i]}`
}

function getFileExtension(mimeType: string): string {
  const ext = mimeType.split('/')[1]?.toUpperCase()
  // Map common mime types to user-friendly extensions
  const extMap: Record<string, string> = {
    'JPEG': 'JPG',
    'SVG+XML': 'SVG',
  }
  return extMap[ext] || ext
}

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

export function MediaGallery({
  items,
  loading = false,
  onItemClick,
  selectedId,
}: MediaGalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (loading) {
    return (
      <div
        className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-3 lg:grid-cols-4' : 'space-y-3'}
        data-oid="b:-i:f4"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden" data-oid="76vavot">
            {viewMode === 'grid' ? (
              <>
                <Skeleton className="aspect-square w-full" data-oid=".vf:iqg" />
                <div className="p-3 space-y-2" data-oid="qipo9j9">
                  <Skeleton className="h-4 w-3/4" data-oid="keybarr" />
                  <Skeleton className="h-3 w-1/2" data-oid="2-9-axj" />
                </div>
              </>
            ) : (
              <div className="flex gap-4 p-3" data-oid="wex.c9i">
                <Skeleton className="h-20 w-20 rounded" data-oid="vrwn0p_" />
                <div className="flex-1 space-y-2" data-oid="cb_yfuy">
                  <Skeleton className="h-4 w-1/2" data-oid="d4-3ld4" />
                  <Skeleton className="h-3 w-1/3" data-oid="az3q5ue" />
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
      <Card className="p-12" data-oid="vv5s01p">
        <div
          className="flex flex-col items-center justify-center text-center space-y-4"
          data-oid="4-m5_.6"
        >
          <div className="rounded-full bg-muted p-6" data-oid="5o4zfpz">
            <ImageIcon className="h-12 w-12 text-muted-foreground" data-oid="tgo76vb" />
          </div>
          <div data-oid="rxuayw:">
            <h3 className="text-lg font-semibold" data-oid="sss11p-">
              No hay archivos
            </h3>
            <p className="text-sm text-muted-foreground" data-oid="lwl8ix-">
              Sube tu primera imagen para empezar
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4" data-oid="ca8qd2b">
      {/* View Mode Toggle */}
      <div className="flex justify-end" data-oid="ljqgwtf">
        <div className="flex gap-1 rounded-lg border p-1" data-oid="fah_a.d">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            data-oid="di6t:5t"
          >
            <Grid3x3 className="h-4 w-4" data-oid="kwwlt8-" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            data-oid="2gnhf0y"
          >
            <List className="h-4 w-4" data-oid="zi2_bj8" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4" data-oid="c6si07:">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`
                group cursor-pointer overflow-hidden transition-all hover:shadow-lg
                ${selectedId === item.id ? 'ring-2 ring-primary' : ''}
              `}
              onClick={() => onItemClick?.(item)}
              data-oid=":9q1lb6"
            >
              <div className="aspect-square relative overflow-hidden bg-muted" data-oid="t6taz4d">
                <img
                  src={item.sizes?.thumbnail?.url || item.thumbnailURL || item.url}
                  alt={item.alt}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  data-oid="-e0w7vf"
                />

                <div className="absolute top-2 right-2" data-oid="wl2x8eg">
                  <Badge variant="secondary" className="text-xs" data-oid="qib71je">
                    {getFileExtension(item.mimeType)}
                  </Badge>
                </div>
              </div>
              <div className="p-3 space-y-1" data-oid="j18.dit">
                <p
                  className="font-medium text-sm truncate"
                  title={item.filename}
                  data-oid="fzid4ks"
                >
                  {item.filename}
                </p>
                <div
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  data-oid="n-7dl6u"
                >
                  <HardDrive className="h-3 w-3" data-oid="uyaa0b2" />
                  <span data-oid="5f39.dg">{formatFileSize(item.filesize)}</span>
                  {item.width && item.height && (
                    <>
                      <span data-oid="k:m9b_:">•</span>
                      <span data-oid="q4j-quf">
                        {item.width}×{item.height}
                      </span>
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
        <div className="space-y-2" data-oid="b3op1gg">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`
                cursor-pointer transition-all hover:shadow-md
                ${selectedId === item.id ? 'ring-2 ring-primary' : ''}
              `}
              onClick={() => onItemClick?.(item)}
              data-oid="ioe7f3o"
            >
              <div className="flex gap-4 p-4" data-oid="obeehut">
                {/* Thumbnail */}
                <div
                  className="h-20 w-20 flex-shrink-0 rounded overflow-hidden bg-muted"
                  data-oid="lxdlt-q"
                >
                  <img
                    src={item.sizes?.thumbnail?.url || item.thumbnailURL || item.url}
                    alt={item.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    data-oid="3tcs33z"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0" data-oid="975dlef">
                  <div className="flex items-start justify-between gap-4" data-oid="vsac10p">
                    <div className="flex-1 min-w-0" data-oid="5-1:u4r">
                      <p className="font-medium truncate" title={item.filename} data-oid="xrawrmg">
                        {item.filename}
                      </p>
                      <p
                        className="text-sm text-muted-foreground truncate mt-1"
                        title={item.alt}
                        data-oid="y5k7g8."
                      >
                        {item.alt}
                      </p>
                    </div>
                    <Badge variant="secondary" data-oid="axz70sx">
                      {getFileExtension(item.mimeType)}
                    </Badge>
                  </div>

                  <div
                    className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground"
                    data-oid="-s7993d"
                  >
                    <div className="flex items-center gap-1" data-oid="c83y77.">
                      <HardDrive className="h-3 w-3" data-oid=":7cyz.s" />
                      <span data-oid="c39fc.8">{formatFileSize(item.filesize)}</span>
                    </div>
                    {item.width && item.height && (
                      <div className="flex items-center gap-1" data-oid=".i_54un">
                        <FileImage className="h-3 w-3" data-oid="5een9c5" />
                        <span data-oid="p0znjoq">
                          {item.width}×{item.height}px
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1" data-oid="uoyn3p4">
                      <Calendar className="h-3 w-3" data-oid="nnx5drj" />
                      <span data-oid="2xvu.0-">
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
    JPEG: 'JPG',
    'SVG+XML': 'SVG',
  }
  return extMap[ext] || ext
}

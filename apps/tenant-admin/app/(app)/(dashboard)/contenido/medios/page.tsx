'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Upload, Image as ImageIcon, HardDrive, FileImage } from 'lucide-react'
import { MediaGallery, type MediaItem } from './components/MediaGallery'
import { MediaUpload } from './components/MediaUpload'
import { MediaFilters, type MediaFiltersState } from './components/MediaFilters'
import { MediaDetails } from './components/MediaDetails'
import { useToast } from '@payload-config/hooks/use-toast'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@payload-config/components/ui/pagination'

/** Size variant in the API response */
interface MediaSizeVariant {
  url: string
  width: number
  height: number
}

/** Media sizes object from API */
interface MediaSizes {
  thumbnail?: MediaSizeVariant
  card?: MediaSizeVariant
  hero?: MediaSizeVariant
}

/** Nested file object that may be present in some API responses */
interface MediaFileObject {
  filename?: string
  mimeType?: string
  filesize?: number
  url?: string
}

/** Raw document from the media API */
interface MediaApiDocument {
  id: string
  filename?: string
  mimeType?: string
  filesize?: number
  width?: number
  height?: number
  alt?: string
  url?: string
  sizes?: MediaSizes
  file?: MediaFileObject
  createdAt: string
  updatedAt: string
}

/** Convert absolute Payload media URLs to relative paths */
function toRelativeUrl(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url, 'http://localhost')
    return parsed.pathname
  } catch {
    return url
  }
}

function toStrictVariant(variant?: {
  url?: string
  width?: number
  height?: number
}): MediaSizeVariant | undefined {
  if (!variant?.url || typeof variant.width !== 'number' || typeof variant.height !== 'number') {
    return undefined
  }

  return {
    url: variant.url,
    width: variant.width,
    height: variant.height,
  }
}

/** API response structure for media list */
interface MediaApiResponse {
  docs?: MediaApiDocument[]
}

/** API response for media update */
interface MediaUpdateResponse {
  id: string
  alt?: string
  updatedAt?: string
}

/** Toast options for notifications */
interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

/** Toast function signature */
type ToastFunction = (options: ToastOptions) => void

/** Toast hook result */
interface ToastHookResult {
  toast: ToastFunction
}

const ITEMS_PER_PAGE = 20

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const { toast } = useToast() as unknown as ToastHookResult

  const [filters, setFilters] = useState<MediaFiltersState>({
    search: '',
    fileType: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    dateRange: 'all',
  })

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/media?limit=200&sort=-createdAt')
      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }
      const data = (await response.json()) as MediaApiResponse
      const items: MediaItem[] = (data.docs ?? []).map((doc: MediaApiDocument) => {
        const thumbnail = toStrictVariant(doc.sizes?.thumbnail)
        const card = toStrictVariant(doc.sizes?.card)
        const hero = toStrictVariant(doc.sizes?.hero)

        return {
          id: doc.id,
          filename: doc.filename ?? doc.file?.filename ?? 'media',
          mimeType: doc.mimeType ?? doc.file?.mimeType ?? 'application/octet-stream',
          filesize: doc.filesize ?? doc.file?.filesize ?? 0,
          width: doc.width,
          height: doc.height,
          alt: doc.alt ?? doc.filename ?? 'Media',
          url: toRelativeUrl(doc.url ?? doc.file?.url ?? ''),
          thumbnailURL: toRelativeUrl(doc.sizes?.thumbnail?.url ?? ''),
          sizes: {
            ...(thumbnail ? { thumbnail } : {}),
            ...(card ? { card } : {}),
            ...(hero ? { hero } : {}),
          },
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }
      })

      setMediaItems(items)
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la biblioteca de medios',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchMedia()
  }, [fetchMedia])

  // Filter and sort logic
  const filteredItems = useMemo(() => {
    let items = [...mediaItems]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      items = items.filter(
        (item) =>
          item.filename.toLowerCase().includes(searchLower) ||
          item.alt.toLowerCase().includes(searchLower)
      )
    }

    // File type filter
    if (filters.fileType !== 'all') {
      items = items.filter((item) =>
        item.mimeType.toLowerCase().includes(filters.fileType.toLowerCase())
      )
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      items = items.filter((item) => new Date(item.createdAt) >= filterDate)
    }

    // Sorting
    items.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename)
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'size':
          comparison = a.filesize - b.filesize
          break
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return items
  }, [mediaItems, filters])

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // Stats
  const stats = useMemo(() => {
    const totalSize = mediaItems.reduce((sum, item) => sum + item.filesize, 0)
    const typeCount = mediaItems.reduce(
      (acc, item) => {
        const type = item.mimeType.split('/')[1]?.toUpperCase() ?? 'UNKNOWN'
        acc[type] = (acc[type] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: mediaItems.length,
      totalSize,
      typeCount,
    }
  }, [mediaItems])

  const handleItemClick = (item: MediaItem) => {
    setSelectedItem(item)
    setDetailsDialogOpen(true)
  }

  const handleUpdateItem = async (id: string, data: Partial<MediaItem>) => {
    const response = await fetch(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to update media')
    }

    const updated = (await response.json()) as MediaUpdateResponse
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              alt: updated.alt ?? item.alt,
              updatedAt: updated.updatedAt ?? item.updatedAt,
            }
          : item
      )
    )
    if (selectedItem?.id === id) {
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              alt: updated.alt ?? prev.alt,
              updatedAt: updated.updatedAt ?? prev.updatedAt,
            }
          : null
      )
    }
  }

  const handleDeleteItem = async (id: string) => {
    const response = await fetch(`/api/media/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete media')
    }

    setMediaItems((prev) => prev.filter((item) => item.id !== id))
    if (selectedItem?.id === id) {
      setSelectedItem(null)
      setDetailsDialogOpen(false)
    }
  }

  const handleUploadComplete = () => {
    toast({
      title: 'Subida completada',
      description: 'Los archivos se han subido correctamente',
    })
    void fetchMedia()
  }

  return (
    <div className="space-y-6" data-oid="m.b77eq">
      <PageHeader
        title="Medios"
        description="Biblioteca de medios y gestión de archivos multimedia"
        icon={ImageIcon}
        actions={
          <Button
            onClick={() => setUploadDialogOpen(true)}
            style={{ backgroundColor: '#F2014B' }}
            data-oid="e:f7ub0"
          >
            <Upload className="mr-2 h-4 w-4" data-oid="7_ywcdf" />
            Subir Archivos
          </Button>
        }
        data-oid="vl:-hmu"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4" data-oid="7t.ps1.">
        <Card data-oid="vka1r3a">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="kt8slr3"
          >
            <CardTitle className="text-sm font-medium" data-oid="xvgf-h9">
              Total de Archivos
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" data-oid="dcr5vvf" />
          </CardHeader>
          <CardContent data-oid="z6jjzmy">
            <div className="text-2xl font-bold" data-oid="o0uoaw_">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="faw8.a.">
              en la biblioteca
            </p>
          </CardContent>
        </Card>

        <Card data-oid="6mo.ph_">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="wz1p6_j"
          >
            <CardTitle className="text-sm font-medium" data-oid="l6a99zs">
              Espacio Usado
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" data-oid="fldb__1" />
          </CardHeader>
          <CardContent data-oid="flnwcsv">
            <div className="text-2xl font-bold" data-oid="je8fczo">
              {formatFileSize(stats.totalSize)}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="9x2j9u-">
              almacenamiento total
            </p>
          </CardContent>
        </Card>

        {Object.entries(stats.typeCount)
          .slice(0, 2)
          .map(([type, count]) => (
            <Card key={type} data-oid="286nme4">
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
                data-oid="k49zbtd"
              >
                <CardTitle className="text-sm font-medium" data-oid="af87oeh">
                  {type}
                </CardTitle>
                <FileImage className="h-4 w-4 text-muted-foreground" data-oid="-dgw:e_" />
              </CardHeader>
              <CardContent data-oid="aj:kawg">
                <div className="text-2xl font-bold" data-oid="4e9ilpk">
                  {count}
                </div>
                <p className="text-xs text-muted-foreground" data-oid="8p9_yvn">
                  archivo(s)
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Filters */}
      <MediaFilters
        filters={filters}
        onChange={setFilters}
        totalItems={mediaItems.length}
        filteredItems={filteredItems.length}
        data-oid="_fbear3"
      />

      {/* Gallery */}
      <MediaGallery
        items={paginatedItems}
        loading={loading}
        onItemClick={handleItemClick}
        selectedId={selectedItem?.id}
        data-oid="ccdrpv8"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center" data-oid="4b-mbsd">
          <Pagination data-oid="j00ck75">
            <PaginationContent data-oid="0uozpwq">
              <PaginationItem data-oid="vuh:ws5">
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }
                  data-oid="d8k11zs"
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <PaginationItem key={pageNum} data-oid="blgiyty">
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                      data-oid="hi6o4bj"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {totalPages > 5 && (
                <>
                  <PaginationItem data-oid="amqtn66">
                    <PaginationEllipsis data-oid="g-dleri" />
                  </PaginationItem>
                  <PaginationItem data-oid="099sf78">
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                      isActive={currentPage === totalPages}
                      className="cursor-pointer"
                      data-oid="z780nr:"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem data-oid="0p:h4_5">
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }
                  data-oid="k9h_oq6"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Dialogs */}
      <MediaUpload
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
        data-oid="u40fmhg"
      />

      <MediaDetails
        item={selectedItem}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
        data-oid="trevk_g"
      />
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
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

// Mock data for development
const mockMediaData: MediaItem[] = [
  {
    id: '1',
    filename: 'campus-norte-exterior.jpg',
    mimeType: 'image/jpeg',
    filesize: 2457600, // 2.4 MB
    width: 1920,
    height: 1080,
    alt: 'Vista exterior del Campus Norte CEP',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
    thumbnailURL: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400',
    sizes: {
      thumbnail: { url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', width: 400, height: 300 },
      card: { url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=768', width: 768, height: 576 },
      hero: { url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1920', width: 1920, height: 1080 },
    },
    createdAt: '2024-12-20T10:30:00Z',
    updatedAt: '2024-12-20T10:30:00Z',
  },
  {
    id: '2',
    filename: 'aula-informatica.jpg',
    mimeType: 'image/jpeg',
    filesize: 1856000, // 1.8 MB
    width: 1920,
    height: 1080,
    alt: 'Aula de informática equipada con ordenadores modernos',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    thumbnailURL: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
    sizes: {
      thumbnail: { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', width: 400, height: 300 },
      card: { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=768', width: 768, height: 576 },
      hero: { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920', width: 1920, height: 1080 },
    },
    createdAt: '2024-12-19T15:45:00Z',
    updatedAt: '2024-12-19T15:45:00Z',
  },
  {
    id: '3',
    filename: 'estudiantes-grupo.jpg',
    mimeType: 'image/jpeg',
    filesize: 3145728, // 3 MB
    width: 2400,
    height: 1600,
    alt: 'Grupo de estudiantes trabajando en proyecto colaborativo',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    thumbnailURL: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
    sizes: {
      thumbnail: { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', width: 400, height: 300 },
      card: { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=768', width: 768, height: 576 },
      hero: { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920', width: 1920, height: 1080 },
    },
    createdAt: '2024-12-18T09:15:00Z',
    updatedAt: '2024-12-18T09:15:00Z',
  },
  {
    id: '4',
    filename: 'logo-cep.png',
    mimeType: 'image/png',
    filesize: 524288, // 512 KB
    width: 800,
    height: 800,
    alt: 'Logo oficial CEP Comunicación',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800',
    thumbnailURL: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400',
    sizes: {
      thumbnail: { url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400', width: 400, height: 300 },
      card: { url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=768', width: 768, height: 576 },
      hero: { url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=1920', width: 1920, height: 1080 },
    },
    createdAt: '2024-12-15T12:00:00Z',
    updatedAt: '2024-12-22T16:30:00Z',
  },
  {
    id: '5',
    filename: 'certificado-plantilla.png',
    mimeType: 'image/png',
    filesize: 1048576, // 1 MB
    width: 3508,
    height: 2480,
    alt: 'Plantilla de certificado de finalización de curso',
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    thumbnailURL: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
    sizes: {
      thumbnail: { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400', width: 400, height: 300 },
      card: { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=768', width: 768, height: 576 },
      hero: { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920', width: 1920, height: 1080 },
    },
    createdAt: '2024-12-10T08:20:00Z',
    updatedAt: '2024-12-10T08:20:00Z',
  },
  {
    id: '6',
    filename: 'profesor-clase.jpg',
    mimeType: 'image/jpeg',
    filesize: 2097152, // 2 MB
    width: 1920,
    height: 1280,
    alt: 'Profesor impartiendo clase en el aula',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
    thumbnailURL: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400',
    sizes: {
      thumbnail: { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400', width: 400, height: 300 },
      card: { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=768', width: 768, height: 576 },
      hero: { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1920', width: 1920, height: 1080 },
    },
    createdAt: '2024-12-25T14:00:00Z',
    updatedAt: '2024-12-25T14:00:00Z',
  },
]

const ITEMS_PER_PAGE = 20

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(mockMediaData)
  const [loading, setLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  const [filters, setFilters] = useState<MediaFiltersState>({
    search: '',
    fileType: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    dateRange: 'all',
  })

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
    const typeCount = mediaItems.reduce((acc, item) => {
      const type = item.mimeType.split('/')[1]?.toUpperCase() || 'UNKNOWN'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

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
    // TODO: Replace with actual API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setMediaItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
          )
        )
        if (selectedItem?.id === id) {
          setSelectedItem((prev) => (prev ? { ...prev, ...data } : null))
        }
        resolve()
      }, 500)
    })
  }

  const handleDeleteItem = async (id: string) => {
    // TODO: Replace with actual API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setMediaItems((prev) => prev.filter((item) => item.id !== id))
        resolve()
      }, 500)
    })
  }

  const handleUploadComplete = () => {
    // TODO: Refresh data from API
    toast({
      title: 'Subida completada',
      description: 'Los archivos se han subido correctamente',
    })
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medios</h1>
          <p className="text-muted-foreground">
            Biblioteca de medios y gestión de archivos multimedia
          </p>
        </div>
        <Button
          onClick={() => setUploadDialogOpen(true)}
          style={{ backgroundColor: '#F2014B' }}
        >
          <Upload className="mr-2 h-4 w-4" />
          Subir Archivos
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Archivos</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">en la biblioteca</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacio Usado</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">almacenamiento total</p>
          </CardContent>
        </Card>

        {Object.entries(stats.typeCount).slice(0, 2).map(([type, count]) => (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{type}</CardTitle>
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground">archivo(s)</p>
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
      />

      {/* Gallery */}
      <MediaGallery
        items={paginatedItems}
        loading={loading}
        onItemClick={handleItemClick}
        selectedId={selectedItem?.id}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {totalPages > 5 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                      isActive={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
      />

      <MediaDetails
        item={selectedItem}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
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

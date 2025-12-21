/**
 * @fileoverview Media browser/manager component
 * Provides folder navigation, file listing, search, and preview
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'

export interface MediaItem {
  id: string
  filename: string
  alt?: string
  url: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  folder?: string
  createdAt: string
  updatedAt: string
}

export interface MediaBrowserProps {
  items: MediaItem[]
  selectedIds?: string[]
  onSelect?: (item: MediaItem) => void
  onMultiSelect?: (items: MediaItem[]) => void
  onDelete?: (ids: string[]) => void
  onRefresh?: () => void
  isLoading?: boolean
  selectionMode?: 'single' | 'multiple' | 'none'
  className?: string
}

type ViewMode = 'grid' | 'list'
type SortField = 'filename' | 'createdAt' | 'filesize'
type SortOrder = 'asc' | 'desc'

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Get file icon based on MIME type
 */
function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
  return '📄'
}

/**
 * Check if file is previewable as image
 */
function isImagePreviewable(mimeType: string): boolean {
  return mimeType.startsWith('image/') && !mimeType.includes('svg')
}

export function MediaBrowser({
  items,
  selectedIds = [],
  onSelect,
  onMultiSelect,
  onDelete,
  onRefresh,
  isLoading = false,
  selectionMode = 'single',
  className,
}: MediaBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [localSelection, setLocalSelection] = useState<Set<string>>(new Set(selectedIds))

  // Extract unique folders
  const folders = useMemo(() => {
    const folderSet = new Set<string>()
    items.forEach(item => {
      if (item.folder) {
        const parts = item.folder.split('/')
        let path = ''
        parts.forEach(part => {
          path = path ? `${path}/${part}` : part
          folderSet.add(path)
        })
      }
    })
    return Array.from(folderSet).sort()
  }, [items])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = items

    // Filter by folder
    if (currentFolder) {
      result = result.filter(item => item.folder === currentFolder || item.folder?.startsWith(`${currentFolder}/`))
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        item =>
          item.filename.toLowerCase().includes(query) ||
          item.alt?.toLowerCase().includes(query)
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0
      if (sortField === 'filename') {
        comparison = a.filename.localeCompare(b.filename)
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortField === 'filesize') {
        comparison = a.filesize - b.filesize
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [items, currentFolder, searchQuery, sortField, sortOrder])

  const handleItemClick = useCallback(
    (item: MediaItem, e: React.MouseEvent) => {
      if (selectionMode === 'none') {
        setPreviewItem(item)
        return
      }

      if (selectionMode === 'multiple' && e.shiftKey) {
        setLocalSelection(prev => {
          const newSet = new Set(prev)
          if (newSet.has(item.id)) {
            newSet.delete(item.id)
          } else {
            newSet.add(item.id)
          }
          const selectedItems = items.filter(i => newSet.has(i.id))
          onMultiSelect?.(selectedItems)
          return newSet
        })
      } else {
        setLocalSelection(new Set([item.id]))
        onSelect?.(item)
      }
    },
    [selectionMode, items, onSelect, onMultiSelect]
  )

  const handleSelectAll = useCallback(() => {
    if (selectionMode !== 'multiple') return

    if (localSelection.size === filteredItems.length) {
      setLocalSelection(new Set())
      onMultiSelect?.([])
    } else {
      setLocalSelection(new Set(filteredItems.map(i => i.id)))
      onMultiSelect?.(filteredItems)
    }
  }, [selectionMode, localSelection.size, filteredItems, onMultiSelect])

  const handleDelete = useCallback(() => {
    if (localSelection.size === 0) return
    onDelete?.(Array.from(localSelection))
    setLocalSelection(new Set())
  }, [localSelection, onDelete])

  // Current folder breadcrumb
  const breadcrumbs = useMemo(() => {
    if (!currentFolder) return []
    return currentFolder.split('/').map((part, index, arr) => ({
      name: part,
      path: arr.slice(0, index + 1).join('/'),
    }))
  }, [currentFolder])

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar archivos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 pl-10 text-sm focus:border-primary focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
        </div>

        {/* Sort */}
        <select
          value={`${sortField}-${sortOrder}`}
          onChange={e => {
            const [field, order] = e.target.value.split('-') as [SortField, SortOrder]
            setSortField(field)
            setSortOrder(order)
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="createdAt-desc">Mas recientes</option>
          <option value="createdAt-asc">Mas antiguos</option>
          <option value="filename-asc">Nombre A-Z</option>
          <option value="filename-desc">Nombre Z-A</option>
          <option value="filesize-desc">Mayor tamano</option>
          <option value="filesize-asc">Menor tamano</option>
        </select>

        {/* View mode */}
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            ≡
          </button>
        </div>

        {/* Actions */}
        {selectionMode === 'multiple' && localSelection.size > 0 && (
          <>
            <span className="text-sm text-muted-foreground">
              {localSelection.size} seleccionado(s)
            </span>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground"
              >
                Eliminar
              </button>
            )}
          </>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            {isLoading ? '⏳' : '🔄'}
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setCurrentFolder(null)}
          className={`hover:text-primary ${!currentFolder ? 'font-medium text-primary' : ''}`}
        >
          📁 Todos
        </button>
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            <span className="text-muted-foreground">/</span>
            <button
              onClick={() => setCurrentFolder(crumb.path)}
              className={`hover:text-primary ${currentFolder === crumb.path ? 'font-medium text-primary' : ''}`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Folder list (only show first-level children) */}
      {!searchQuery && (
        <div className="flex flex-wrap gap-2">
          {folders
            .filter(f => {
              if (!currentFolder) return !f.includes('/')
              return f.startsWith(`${currentFolder}/`) && f.split('/').length === currentFolder.split('/').length + 1
            })
            .map(folder => (
              <button
                key={folder}
                onClick={() => setCurrentFolder(folder)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                📂 {folder.split('/').pop()}
              </button>
            ))}
        </div>
      )}

      {/* Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <span className="text-4xl">📭</span>
          <p className="mt-2">No se encontraron archivos</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={e => handleItemClick(item, e)}
              className={`
                group cursor-pointer overflow-hidden rounded-lg border-2 transition-all
                ${localSelection.has(item.id) ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
              `}
            >
              {/* Preview */}
              <div className="relative aspect-square bg-muted">
                {isImagePreviewable(item.mimeType) ? (
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl">
                    {getFileIcon(item.mimeType)}
                  </div>
                )}
                {/* Selection indicator */}
                {selectionMode !== 'none' && (
                  <div
                    className={`
                      absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2
                      ${localSelection.has(item.id) ? 'border-primary bg-primary text-white' : 'border-white bg-white/50 opacity-0 group-hover:opacity-100'}
                    `}
                  >
                    {localSelection.has(item.id) && '✓'}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-2">
                <p className="truncate text-sm font-medium">{item.filename}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(item.filesize)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted text-sm">
              <tr>
                {selectionMode === 'multiple' && (
                  <th className="w-12 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={localSelection.size === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="px-3 py-2 text-left">Archivo</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-right">Tamano</th>
                <th className="px-3 py-2 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr
                  key={item.id}
                  onClick={e => handleItemClick(item, e)}
                  className={`
                    cursor-pointer border-t border-border text-sm
                    ${localSelection.has(item.id) ? 'bg-primary/10' : 'hover:bg-muted/50'}
                  `}
                >
                  {selectionMode === 'multiple' && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={localSelection.has(item.id)}
                        onChange={() => {}}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>{getFileIcon(item.mimeType)}</span>
                      <span className="truncate">{item.filename}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {item.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {formatFileSize(item.filesize)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-background p-4"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-background p-2 shadow-lg hover:bg-muted"
            >
              ✕
            </button>
            {isImagePreviewable(previewItem.mimeType) ? (
              <img
                src={previewItem.url}
                alt={previewItem.alt || previewItem.filename}
                className="max-h-[80vh] w-auto"
              />
            ) : previewItem.mimeType === 'application/pdf' ? (
              <iframe
                src={previewItem.url}
                className="h-[80vh] w-full min-w-[600px]"
                title={previewItem.filename}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 p-8">
                <span className="text-6xl">{getFileIcon(previewItem.mimeType)}</span>
                <p className="text-lg font-medium">{previewItem.filename}</p>
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                >
                  Descargar
                </a>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              <p><strong>Nombre:</strong> {previewItem.filename}</p>
              <p><strong>Tamano:</strong> {formatFileSize(previewItem.filesize)}</p>
              {previewItem.width && previewItem.height && (
                <p><strong>Dimensiones:</strong> {previewItem.width} x {previewItem.height}</p>
              )}
              <p><strong>Fecha:</strong> {formatDate(previewItem.createdAt)}</p>
              {previewItem.alt && <p><strong>Alt:</strong> {previewItem.alt}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaBrowser

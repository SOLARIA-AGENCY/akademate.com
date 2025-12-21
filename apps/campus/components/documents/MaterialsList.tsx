/**
 * @fileoverview Materials list component for displaying lesson resources
 * Shows downloadable materials attached to lessons
 */

'use client'

import React, { useState } from 'react'

export type MaterialType = 'pdf' | 'video' | 'audio' | 'document' | 'link' | 'other'

export interface Material {
  id: string
  title: string
  description?: string
  type: MaterialType
  url: string
  filesize?: number
  duration?: string // For video/audio
  isPublic?: boolean
}

export interface MaterialsListProps {
  materials: Material[]
  onDownload?: (material: Material) => void
  className?: string
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get icon for material type
 */
function getMaterialIcon(type: MaterialType): string {
  switch (type) {
    case 'pdf':
      return '📕'
    case 'video':
      return '🎬'
    case 'audio':
      return '🎵'
    case 'document':
      return '📄'
    case 'link':
      return '🔗'
    default:
      return '📎'
  }
}

/**
 * Get color class for material type
 */
function getMaterialColor(type: MaterialType): string {
  switch (type) {
    case 'pdf':
      return 'bg-red-500/10 text-red-600 border-red-500/30'
    case 'video':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/30'
    case 'audio':
      return 'bg-green-500/10 text-green-600 border-green-500/30'
    case 'document':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/30'
    case 'link':
      return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/30'
  }
}

/**
 * Get human-readable type name
 */
function getMaterialTypeName(type: MaterialType): string {
  switch (type) {
    case 'pdf':
      return 'PDF'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Audio'
    case 'document':
      return 'Documento'
    case 'link':
      return 'Enlace'
    default:
      return 'Archivo'
  }
}

export function MaterialsList({ materials, onDownload, className }: MaterialsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (materials.length === 0) {
    return null
  }

  const handleClick = (material: Material) => {
    if (material.type === 'link') {
      window.open(material.url, '_blank', 'noopener,noreferrer')
    } else {
      onDownload?.(material)
      // Open in new tab for download
      window.open(material.url, '_blank')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  // Group materials by type
  const groupedMaterials = materials.reduce(
    (acc, material) => {
      const type = material.type
      if (!acc[type]) acc[type] = []
      acc[type].push(material)
      return acc
    },
    {} as Record<MaterialType, Material[]>
  )

  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      <div className="border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <span>📚</span>
          <span>Materiales del curso</span>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">
            {materials.length}
          </span>
        </h3>
      </div>

      <div className="divide-y divide-border">
        {Object.entries(groupedMaterials).map(([type, items]) => (
          <div key={type} className="p-3">
            {/* Type header */}
            <button
              onClick={() => toggleExpand(type)}
              className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <span>{getMaterialIcon(type as MaterialType)}</span>
              <span>{getMaterialTypeName(type as MaterialType)}</span>
              <span className="ml-1 text-xs">({items.length})</span>
              <span className="ml-auto transition-transform">{expandedId === type ? '▼' : '▶'}</span>
            </button>

            {/* Materials list */}
            <div
              className={`mt-2 space-y-2 overflow-hidden transition-all ${
                expandedId === type || Object.keys(groupedMaterials).length === 1
                  ? 'max-h-[1000px] opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              {items.map(material => (
                <div
                  key={material.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${getMaterialColor(
                    material.type
                  )}`}
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-background text-xl">
                    {getMaterialIcon(material.type)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium">{material.title}</h4>
                    {material.description && (
                      <p className="mt-0.5 text-sm opacity-70">{material.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-2 text-xs opacity-60">
                      {material.filesize && (
                        <span>{formatFileSize(material.filesize)}</span>
                      )}
                      {material.duration && <span>{material.duration}</span>}
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleClick(material)}
                    className="flex-shrink-0 rounded-lg bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {material.type === 'link' ? 'Abrir' : 'Descargar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Compact inline materials display
 */
export function MaterialsInline({ materials, className }: { materials: Material[]; className?: string }) {
  if (materials.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {materials.map(material => (
        <a
          key={material.id}
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted ${getMaterialColor(
            material.type
          )}`}
        >
          <span>{getMaterialIcon(material.type)}</span>
          <span className="max-w-[150px] truncate">{material.title}</span>
        </a>
      ))}
    </div>
  )
}

export default MaterialsList

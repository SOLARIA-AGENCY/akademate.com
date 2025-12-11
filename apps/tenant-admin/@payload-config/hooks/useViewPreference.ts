'use client'

import { useState, useEffect, useCallback } from 'react'

export type ViewType = 'grid' | 'list'

/**
 * Hook para manejar la preferencia de visualización (grid/lista) por sección
 * Guarda la preferencia en localStorage para persistencia
 *
 * @param sectionKey - Identificador único de la sección (ej: 'cursos', 'ciclos', 'sedes')
 * @returns [view, setView] - Estado actual y función para cambiarlo
 */
export const useViewPreference = (sectionKey: string) => {
  const [view, setView] = useState<ViewType>('grid')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`view-preference-${sectionKey}`)
      if (saved === 'grid' || saved === 'list') {
        setView(saved)
      }
      setIsInitialized(true)
    }
  }, [sectionKey])

  const updateView = useCallback(
    (newView: ViewType) => {
      setView(newView)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`view-preference-${sectionKey}`, newView)
      }
    },
    [sectionKey]
  )

  return [view, updateView, isInitialized] as const
}

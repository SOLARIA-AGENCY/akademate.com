'use client';
import { useState, useEffect, useCallback } from 'react';
/**
 * Hook para manejar la preferencia de visualización (grid/lista) por sección
 * Guarda la preferencia en localStorage para persistencia
 *
 * @param sectionKey - Identificador único de la sección (ej: 'cursos', 'ciclos', 'sedes')
 * @returns [view, setView] - Estado actual y función para cambiarlo
 */
export const useViewPreference = (sectionKey) => {
    const [view, setView] = useState('grid');
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        // Solo ejecutar en el cliente
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`view-preference-${sectionKey}`);
            if (saved === 'grid' || saved === 'list') {
                setView(saved);
            }
            setIsInitialized(true);
        }
    }, [sectionKey]);
    const updateView = useCallback((newView) => {
        setView(newView);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`view-preference-${sectionKey}`, newView);
        }
    }, [sectionKey]);
    return [view, updateView, isInitialized];
};
//# sourceMappingURL=useViewPreference.js.map
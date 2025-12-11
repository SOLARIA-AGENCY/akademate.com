export type ViewType = 'grid' | 'list';
/**
 * Hook para manejar la preferencia de visualización (grid/lista) por sección
 * Guarda la preferencia en localStorage para persistencia
 *
 * @param sectionKey - Identificador único de la sección (ej: 'cursos', 'ciclos', 'sedes')
 * @returns [view, setView] - Estado actual y función para cambiarlo
 */
export declare const useViewPreference: (sectionKey: string) => readonly [ViewType, (newView: ViewType) => void, boolean];
//# sourceMappingURL=useViewPreference.d.ts.map
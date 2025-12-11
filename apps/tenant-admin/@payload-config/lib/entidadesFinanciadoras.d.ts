/**
 * Catálogo de Entidades Financiadoras
 *
 * Define las entidades que pueden financiar cursos:
 * - Organismos públicos (FUNDAE, SEPE, Ministerios, Juntas Autonómicas)
 * - Fondos europeos (FSE, Next Generation EU)
 * - Entidades privadas (Cámaras de Comercio, empresas)
 */
import type { EntidadFinanciadoraKey, EntidadFinanciadoraInfo } from '@/types';
export declare const ENTIDADES_INFO: Record<EntidadFinanciadoraKey, EntidadFinanciadoraInfo>;
/**
 * Get entity information by key
 */
export declare function getEntidadInfo(key: EntidadFinanciadoraKey): EntidadFinanciadoraInfo;
/**
 * Get all available entities as array
 */
export declare function getAllEntidades(): Array<{
    key: EntidadFinanciadoraKey;
} & EntidadFinanciadoraInfo>;
/**
 * Get available entities excluding some keys
 */
export declare function getEntidadesDisponibles(excluidas?: EntidadFinanciadoraKey[]): Array<{
    key: EntidadFinanciadoraKey;
} & EntidadFinanciadoraInfo>;
//# sourceMappingURL=entidadesFinanciadoras.d.ts.map
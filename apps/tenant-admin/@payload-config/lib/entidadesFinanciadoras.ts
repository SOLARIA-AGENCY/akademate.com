/**
 * Catálogo de Entidades Financiadoras
 *
 * Define las entidades que pueden financiar cursos:
 * - Organismos públicos (FUNDAE, SEPE, Ministerios, Juntas Autonómicas)
 * - Fondos europeos (FSE, Next Generation EU)
 * - Entidades privadas (Cámaras de Comercio, empresas)
 */

import type { EntidadFinanciadoraKey, EntidadFinanciadoraInfo } from '@/types'

export const ENTIDADES_INFO: Record<EntidadFinanciadoraKey, EntidadFinanciadoraInfo> = {
  fundae: {
    nombre: 'FUNDAE',
    descripcion: 'Fundación Estatal para la Formación en el Empleo',
    logo: '/logos/fundae.svg',
    tipoSubvencion: 'publica',
    urlOficial: 'https://www.fundae.es',
  },
  sepe: {
    nombre: 'SEPE',
    descripcion: 'Servicio Público de Empleo Estatal',
    logo: '/logos/sepe.svg',
    tipoSubvencion: 'publica',
    urlOficial: 'https://www.sepe.es',
  },
  ministerio_trabajo: {
    nombre: 'Ministerio de Trabajo',
    descripcion: 'Ministerio de Trabajo y Economía Social',
    logo: '/logos/ministerio-trabajo.svg',
    tipoSubvencion: 'publica',
    urlOficial: 'https://www.mites.gob.es',
  },
  ministerio_educacion: {
    nombre: 'Ministerio de Educación',
    descripcion: 'Ministerio de Educación y Formación Profesional',
    logo: '/logos/ministerio-educacion.svg',
    tipoSubvencion: 'publica',
    urlOficial: 'https://www.educacionyfp.gob.es',
  },
  junta_andalucia: {
    nombre: 'Junta de Andalucía',
    descripcion: 'Consejería de Empleo, Formación y Trabajo Autónomo',
    logo: '/logos/junta-andalucia.svg',
    tipoSubvencion: 'publica',
    urlOficial: 'https://www.juntadeandalucia.es',
  },
  junta_madrid: {
    nombre: 'Comunidad de Madrid',
    descripcion: 'Consejería de Economía, Empleo y Hacienda',
    logo: '/logos/comunidad-madrid.svg',
    tipoSubvencion: 'publica',
    urlOficial: 'https://www.comunidad.madrid',
  },
  junta_catalunya: {
    nombre: 'Generalitat de Catalunya',
    descripcion: "Departament d'Empresa i Treball",
    logo: '/logos/generalitat-catalunya.svg',
    tipoSubvencion: 'publica',
    urlOficial: 'https://web.gencat.cat',
  },
  fse: {
    nombre: 'FSE',
    descripcion: 'Fondo Social Europeo',
    logo: '/logos/fse.svg',
    tipoSubvencion: 'europea',
    urlOficial: 'https://ec.europa.eu/esf',
  },
  next_generation: {
    nombre: 'Next Generation EU',
    descripcion: 'Fondos Europeos de Recuperación',
    logo: '/logos/next-generation.svg',
    tipoSubvencion: 'europea',
    urlOficial: 'https://planderecuperacion.gob.es',
  },
  camara_comercio: {
    nombre: 'Cámara de Comercio',
    descripcion: 'Consejo Superior de Cámaras de Comercio',
    logo: '/logos/camara-comercio.svg',
    tipoSubvencion: 'publica',
    urlOficial: 'https://www.camara.es',
  },
  empresa_privada: {
    nombre: 'Empresa Privada',
    descripcion: 'Beca o ayuda de empresa privada',
    logo: '/logos/empresa-generica.svg',
    tipoSubvencion: 'privada',
    urlOficial: '',
  },
  otro: {
    nombre: 'Otra Entidad',
    descripcion: 'Otra entidad financiadora',
    logo: '/logos/otro.svg',
    tipoSubvencion: 'publica',
    urlOficial: '',
  },
}

/**
 * Get entity information by key
 */
export function getEntidadInfo(key: EntidadFinanciadoraKey): EntidadFinanciadoraInfo {
  return ENTIDADES_INFO[key]
}

/**
 * Get all available entities as array
 */
export function getAllEntidades(): Array<{ key: EntidadFinanciadoraKey } & EntidadFinanciadoraInfo> {
  return Object.entries(ENTIDADES_INFO).map(([key, info]) => ({
    key: key as EntidadFinanciadoraKey,
    ...info,
  }))
}

/**
 * Get available entities excluding some keys
 */
export function getEntidadesDisponibles(
  excluidas?: EntidadFinanciadoraKey[]
): Array<{ key: EntidadFinanciadoraKey } & EntidadFinanciadoraInfo> {
  const excluded = excluidas || []
  return getAllEntidades().filter((entidad) => !excluded.includes(entidad.key))
}

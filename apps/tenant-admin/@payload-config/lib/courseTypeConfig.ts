/**
 * Course funding (category) vs modality. Teleformación is modality only.
 * Hover locks to the same background so taxonomy color never shifts.
 */

import type { BadgeSemanticVariant } from './estados'

export const COURSE_FUNDING_TYPES = ['privados', 'ocupados', 'desempleados'] as const
export type CourseFundingType = (typeof COURSE_FUNDING_TYPES)[number]

export const COURSE_MODALITY_TYPES = ['presencial', 'mixto', 'teleformacion'] as const
export type CourseModalityType = (typeof COURSE_MODALITY_TYPES)[number]

const FUNDING_PILL = {
  privados: 'border-red-600 bg-red-600 text-white hover:bg-red-600 hover:text-white',
  ocupados: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white',
  desempleados: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-600 hover:text-white',
} as const

export const COURSE_TYPE_CONFIG = {
  privados: {
    label: 'Privados',
    bgColor: 'bg-red-600',
    hoverColor: 'hover:bg-red-600',
    textColor: 'text-white',
    borderColor: 'border-red-600',
    dotColor: 'bg-red-600',
    pillClass: FUNDING_PILL.privados,
    badgeVariant: 'destructive' as BadgeSemanticVariant,
  },
  ocupados: {
    label: 'Ocupados',
    bgColor: 'bg-emerald-600',
    hoverColor: 'hover:bg-emerald-600',
    textColor: 'text-white',
    borderColor: 'border-emerald-600',
    dotColor: 'bg-emerald-600',
    pillClass: FUNDING_PILL.ocupados,
    badgeVariant: 'success' as BadgeSemanticVariant,
  },
  desempleados: {
    label: 'Desempleados',
    bgColor: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
    dotColor: 'bg-blue-600',
    pillClass: FUNDING_PILL.desempleados,
    badgeVariant: 'info' as BadgeSemanticVariant,
  },
  teleformacion: {
    label: 'Teleformación',
    bgColor: 'bg-yellow-300',
    hoverColor: 'hover:bg-yellow-300',
    textColor: 'text-orange-600',
    borderColor: 'border-yellow-400',
    dotColor: 'bg-orange-500',
    pillClass: 'border-yellow-400 bg-yellow-300 text-orange-600 hover:bg-yellow-300 hover:text-orange-600',
    badgeVariant: 'warning' as BadgeSemanticVariant,
  },
  'ciclo-medio': {
    label: 'Grado medio',
    bgColor: 'bg-slate-100',
    hoverColor: 'hover:bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
    pillClass: 'bg-slate-100 text-slate-600 border-slate-200',
    badgeVariant: 'neutral' as BadgeSemanticVariant,
  },
  'ciclo-superior': {
    label: 'Grado superior',
    bgColor: 'bg-slate-100',
    hoverColor: 'hover:bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
    pillClass: 'bg-slate-100 text-slate-600 border-slate-200',
    badgeVariant: 'neutral' as BadgeSemanticVariant,
  },
} as const

export type CourseTypeKey = keyof typeof COURSE_TYPE_CONFIG

export type CourseTypeConfigValue = (typeof COURSE_TYPE_CONFIG)[CourseTypeKey]

export const COURSE_MODALITY_CONFIG = {
  presencial: {
    label: 'Presencial',
    pillClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
  },
  mixto: {
    label: 'Mixto',
    pillClass: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-50',
  },
  teleformacion: {
    label: 'Teleformación',
    pillClass: 'border-yellow-400 bg-yellow-300 text-orange-600 hover:bg-yellow-300 hover:text-orange-600',
  },
} as const

export const DIRECTORY_CAMPUS_PILL_CLASS =
  'border-red-600 bg-red-600 text-white hover:bg-red-600 hover:text-white'

export const DIRECTORY_AREA_TONES = [
  { pillClass: 'border-rose-200 bg-rose-100 text-rose-800' },
  { pillClass: 'border-orange-200 bg-orange-100 text-orange-800' },
  { pillClass: 'border-amber-200 bg-amber-100 text-amber-800' },
  { pillClass: 'border-lime-200 bg-lime-100 text-lime-800' },
  { pillClass: 'border-emerald-200 bg-emerald-100 text-emerald-800' },
  { pillClass: 'border-teal-200 bg-teal-100 text-teal-800' },
  { pillClass: 'border-sky-200 bg-sky-100 text-sky-800' },
  { pillClass: 'border-indigo-200 bg-indigo-100 text-indigo-800' },
  { pillClass: 'border-violet-200 bg-violet-100 text-violet-800' },
  { pillClass: 'border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800' },
] as const

export function parseDirectoryHexColor(value?: string | null): string | null {
  const raw = (value ?? '').trim()
  return /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw : null
}

export function getDirectoryAreaTone(label?: string | null) {
  const token = normalizeTaxonomyToken(label) || 'sin_area'
  let hash = 0
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0
  }
  return DIRECTORY_AREA_TONES[hash % DIRECTORY_AREA_TONES.length]
}

function normalizeTaxonomyToken(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9_]+/g, '_')
}

export function resolveCourseFundingType(
  courseType?: string | null,
): CourseFundingType {
  const normalized = normalizeTaxonomyToken(courseType)
  if (normalized === 'ocupados' || normalized === 'ocupado') return 'ocupados'
  if (normalized === 'desempleados' || normalized === 'desempleado') return 'desempleados'
  return 'privados'
}

export function resolveCourseModality(
  courseType?: string | null,
  modality?: string | null,
  deliveryMode?: string | null,
): CourseModalityType {
  const type = normalizeTaxonomyToken(courseType)
  if (type === 'teleformacion' || type === 'tele_formacion') return 'teleformacion'

  const mode = normalizeTaxonomyToken(deliveryMode) || normalizeTaxonomyToken(modality)
  if (
    mode === 'online' ||
    mode === 'teleformacion' ||
    mode === 'tele_formacion' ||
    mode === 'telematico'
  ) {
    return 'teleformacion'
  }
  if (
    mode === 'hibrido' ||
    mode === 'hibrida' ||
    mode === 'mixto' ||
    mode === 'semipresencial'
  ) {
    return 'mixto'
  }
  return 'presencial'
}

export function getCourseFundingConfig(courseType?: string | null) {
  return COURSE_TYPE_CONFIG[resolveCourseFundingType(courseType)]
}

export function getCourseModalityConfig(
  courseType?: string | null,
  modality?: string | null,
  deliveryMode?: string | null,
) {
  return COURSE_MODALITY_CONFIG[resolveCourseModality(courseType, modality, deliveryMode)]
}

export function getCourseTypeConfig(type: CourseTypeKey): CourseTypeConfigValue {
  return COURSE_TYPE_CONFIG[type] ?? COURSE_TYPE_CONFIG.privados
}

export function getAllCourseTypes(): CourseTypeKey[] {
  return Object.keys(COURSE_TYPE_CONFIG) as CourseTypeKey[]
}

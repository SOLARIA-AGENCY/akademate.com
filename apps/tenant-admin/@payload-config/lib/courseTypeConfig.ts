/**
 * Course type presentation. Neutral slate / tenant primary.
 * Red is reserved for destructive and critical errors only.
 */

import type { BadgeSemanticVariant } from './estados'

const NEUTRAL_TYPE = {
  bgColor: 'bg-slate-100',
  hoverColor: 'hover:bg-slate-200',
  textColor: 'text-slate-700',
  borderColor: 'border-slate-200',
  dotColor: 'bg-slate-500',
} as const

export const COURSE_TYPE_CONFIG = {
  privados: {
    label: 'Privado',
    ...NEUTRAL_TYPE,
    badgeVariant: 'neutral' as BadgeSemanticVariant,
  },
  ocupados: {
    label: 'Ocupados',
    bgColor: 'bg-emerald-50',
    hoverColor: 'hover:bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    badgeVariant: 'success' as BadgeSemanticVariant,
  },
  desempleados: {
    label: 'Desempleados',
    bgColor: 'bg-primary/10',
    hoverColor: 'hover:bg-primary/15',
    textColor: 'text-primary',
    borderColor: 'border-primary/20',
    dotColor: 'bg-primary',
    badgeVariant: 'info' as BadgeSemanticVariant,
  },
  teleformacion: {
    label: 'Teleformación',
    bgColor: 'bg-slate-100',
    hoverColor: 'hover:bg-slate-200',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-500',
    badgeVariant: 'neutral' as BadgeSemanticVariant,
  },
  'ciclo-medio': {
    label: 'Ciclo medio',
    ...NEUTRAL_TYPE,
    badgeVariant: 'neutral' as BadgeSemanticVariant,
  },
  'ciclo-superior': {
    label: 'Ciclo superior',
    ...NEUTRAL_TYPE,
    badgeVariant: 'neutral' as BadgeSemanticVariant,
  },
} as const

export type CourseTypeKey = keyof typeof COURSE_TYPE_CONFIG

export type CourseTypeConfigValue = (typeof COURSE_TYPE_CONFIG)[CourseTypeKey]

export function getCourseTypeConfig(type: CourseTypeKey): CourseTypeConfigValue {
  return COURSE_TYPE_CONFIG[type] ?? COURSE_TYPE_CONFIG.privados
}

export function getAllCourseTypes(): CourseTypeKey[] {
  return Object.keys(COURSE_TYPE_CONFIG) as CourseTypeKey[]
}

/**
 * Course Type Configuration
 *
 * Centralizes the color-coding system for CEP course types.
 * Color system follows the reference implementation from the main app.
 *
 * COLOR MAPPING:
 * - PRIVADOS: RED (bg-red-600) - Private paid courses
 * - OCUPADOS: GREEN (bg-green-600) - Employed workers (100% subsidized)
 * - DESEMPLEADOS: BLUE (bg-blue-600) - Unemployed workers (free)
 * - TELEFORMACIÓN: ORANGE (bg-orange-600) - Online/remote courses
 * - CICLO MEDIO: PINK/RED (bg-red-500) - Mid-level vocational training
 * - CICLO SUPERIOR: RED (bg-red-600) - Advanced vocational training
 *
 * BADGE VARIANT MAPPING (semantic, for use in card body badges):
 * - PRIVADOS: info (blue) — avoids confusion with primary red CTA
 * - OCUPADOS: success (green)
 * - DESEMPLEADOS: warning (orange)
 * - TELEFORMACIÓN: warning (orange)
 * - CICLO MEDIO / CICLO SUPERIOR: neutral
 */

import type { BadgeSemanticVariant } from './estados'

export const COURSE_TYPE_CONFIG = {
  privados: {
    label: 'PRIVADO',
    bgColor: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    textColor: 'text-red-600',
    borderColor: 'border-red-600',
    dotColor: 'bg-red-600',
    badgeVariant: 'info' as BadgeSemanticVariant,
  },
  ocupados: {
    label: 'OCUPADOS',
    bgColor: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    textColor: 'text-green-600',
    borderColor: 'border-green-600',
    dotColor: 'bg-green-600',
    badgeVariant: 'success' as BadgeSemanticVariant,
  },
  desempleados: {
    label: 'DESEMPLEADOS',
    bgColor: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-600',
    dotColor: 'bg-blue-600',
    badgeVariant: 'warning' as BadgeSemanticVariant,
  },
  teleformacion: {
    label: 'TELEFORMACIÓN',
    bgColor: 'bg-orange-600',
    hoverColor: 'hover:bg-orange-700',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-600',
    dotColor: 'bg-orange-600',
    badgeVariant: 'warning' as BadgeSemanticVariant,
  },
  'ciclo-medio': {
    label: 'CICLO MEDIO',
    bgColor: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    textColor: 'text-red-500',
    borderColor: 'border-red-500',
    dotColor: 'bg-red-500',
    badgeVariant: 'neutral' as BadgeSemanticVariant,
  },
  'ciclo-superior': {
    label: 'CICLO SUPERIOR',
    bgColor: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    textColor: 'text-red-600',
    borderColor: 'border-red-600',
    dotColor: 'bg-red-600',
    badgeVariant: 'neutral' as BadgeSemanticVariant,
  },
} as const

export type CourseTypeKey = keyof typeof COURSE_TYPE_CONFIG

export type CourseTypeConfigValue = (typeof COURSE_TYPE_CONFIG)[CourseTypeKey]

/**
 * Get type configuration for a given course type
 * @param type - The course type
 * @returns Configuration object with colors and labels
 */
export function getCourseTypeConfig(type: CourseTypeKey): CourseTypeConfigValue {
  return COURSE_TYPE_CONFIG[type] ?? COURSE_TYPE_CONFIG.privados
}

/**
 * Get all available course types as array
 */
export function getAllCourseTypes(): CourseTypeKey[] {
  return Object.keys(COURSE_TYPE_CONFIG) as CourseTypeKey[]
}

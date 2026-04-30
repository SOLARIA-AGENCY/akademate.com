import {
  getCourseImagePromptsByType,
  type CourseImagePrompt,
  type CourseAccent,
} from './cep-course-image-prompts'

export type ManagedCourseType = CourseAccent | 'teleformacion'

export function parseManagedCourseType(value: string | undefined | null): ManagedCourseType {
  const normalized = String(value || 'privado').trim().toLowerCase()
  if (normalized === 'ocupados') return 'ocupados'
  if (normalized === 'desempleados') return 'desempleados'
  if (normalized === 'teleformacion' || normalized === 'teleformación' || normalized === 'tel') {
    return 'teleformacion'
  }
  return 'privado'
}

export function getCatalogForCourseType(courseType: ManagedCourseType): CourseImagePrompt[] {
  return getCourseImagePromptsByType(courseType)
}

export function getDefaultOutputDir(courseType: ManagedCourseType): string {
  return courseType === 'privado'
    ? 'output/private-course-images'
    : `output/${courseType}-course-images`
}

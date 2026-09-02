import { Badge } from '@payload-config/components/ui/badge'
import { cn } from '@payload-config/lib/utils'
import {
  getCourseFundingConfig,
  getCourseModalityConfig,
} from '@payload-config/lib/courseTypeConfig'

export function CourseFundingBadge({
  courseType,
  className,
}: {
  courseType?: string | null
  className?: string
}) {
  const config = getCourseFundingConfig(courseType)
  return (
    <Badge
      variant="static"
      data-slot="course-funding-badge"
      title={config.label}
      className={cn('min-w-0 max-w-full shrink overflow-hidden text-ellipsis', config.pillClass, className)}
    >
      {config.label}
    </Badge>
  )
}

export function CourseModalityBadge({
  courseType,
  modality,
  deliveryMode,
  className,
}: {
  courseType?: string | null
  modality?: string | null
  deliveryMode?: string | null
  className?: string
}) {
  const config = getCourseModalityConfig(courseType, modality, deliveryMode)
  return (
    <Badge
      variant="static"
      data-slot="course-modality-badge"
      title={config.label}
      className={cn('min-w-0 max-w-full shrink overflow-hidden text-ellipsis', config.pillClass, className)}
    >
      {config.label}
    </Badge>
  )
}

export function CourseTaxonomyBadges({
  courseType,
  modality,
  deliveryMode,
  className,
}: {
  courseType?: string | null
  modality?: string | null
  deliveryMode?: string | null
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-1.5', className)}>
      <CourseFundingBadge courseType={courseType} />
      <CourseModalityBadge
        courseType={courseType}
        modality={modality}
        deliveryMode={deliveryMode}
      />
    </div>
  )
}

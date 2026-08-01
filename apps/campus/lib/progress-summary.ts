export interface ProgressEnrollment {
  progressPercent: number
  totalModules: number
  completedModules: number
  estimatedMinutesRemaining: number
}

export interface ProgressSummary {
  averageProgress: number
  totalModules: number
  completedModules: number
  estimatedMinutesRemaining: number
}

function boundedInteger(value: number, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.floor(value), 0), maximum)
}

function boundedPercent(value: number) {
  return boundedInteger(value, 100)
}

export function progressSummaryFromEnrollments(
  enrollments: readonly ProgressEnrollment[]
): ProgressSummary {
  if (enrollments.length === 0) {
    return {
      averageProgress: 0,
      totalModules: 0,
      completedModules: 0,
      estimatedMinutesRemaining: 0,
    }
  }

  const totals = enrollments.reduce(
    (summary, enrollment) => {
      const totalModules = boundedInteger(enrollment.totalModules)
      return {
        progress: summary.progress + boundedPercent(enrollment.progressPercent),
        totalModules: summary.totalModules + totalModules,
        completedModules:
          summary.completedModules + boundedInteger(enrollment.completedModules, totalModules),
        estimatedMinutesRemaining:
          summary.estimatedMinutesRemaining + boundedInteger(enrollment.estimatedMinutesRemaining),
      }
    },
    { progress: 0, totalModules: 0, completedModules: 0, estimatedMinutesRemaining: 0 }
  )

  return {
    averageProgress: Math.round(totals.progress / enrollments.length),
    totalModules: totals.totalModules,
    completedModules: totals.completedModules,
    estimatedMinutesRemaining: totals.estimatedMinutesRemaining,
  }
}

import { assertValidMultiEntityTopology, type MultiEntityTopology } from './multi-entity-topology'

export interface MasterCourseResourceRecord {
  readonly id: string
  readonly tenantId: string
}

export interface MasterTeacherResourceRecord {
  readonly id: string
  readonly tenantId: string
}

export interface ClassroomOwnershipRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly campusId: string
}

export interface CourseRunOwnershipRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly courseId: string
  readonly campusId?: string | null
  readonly classroomId?: string | null
  readonly staffAssignmentIds: readonly string[]
}

export interface EnrollmentOwnershipRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly courseRunId: string
}

export interface CampaignOwnershipRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
}

export interface LeadOwnershipRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly courseId?: string | null
  readonly campusId?: string | null
  readonly campaignId?: string | null
}

export interface AdvertisingSpendOwnershipRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly campaignId: string
}

export interface MultiEntityOperationalResources {
  readonly topology: MultiEntityTopology
  readonly courses: readonly MasterCourseResourceRecord[]
  readonly teachers: readonly MasterTeacherResourceRecord[]
  readonly classrooms: readonly ClassroomOwnershipRecord[]
  readonly courseRuns: readonly CourseRunOwnershipRecord[]
  readonly enrollments: readonly EnrollmentOwnershipRecord[]
  readonly campaigns: readonly CampaignOwnershipRecord[]
  readonly leads: readonly LeadOwnershipRecord[]
  readonly advertisingSpends: readonly AdvertisingSpendOwnershipRecord[]
}

export type MultiEntityResourceType = Exclude<keyof MultiEntityOperationalResources, 'topology'>

export type MultiEntityResourceIssueCode =
  | 'duplicate_record_id'
  | 'legal_entity_missing'
  | 'legal_entity_inactive'
  | 'tenant_mismatch'
  | 'campus_missing'
  | 'campus_out_of_entity'
  | 'course_missing'
  | 'classroom_missing'
  | 'classroom_requires_campus'
  | 'classroom_entity_mismatch'
  | 'classroom_campus_mismatch'
  | 'staff_assignment_missing'
  | 'staff_assignment_suspended'
  | 'staff_assignment_entity_mismatch'
  | 'staff_assignment_campus_mismatch'
  | 'teacher_missing'
  | 'course_run_missing'
  | 'course_run_entity_mismatch'
  | 'campaign_missing'
  | 'campaign_entity_mismatch'

export interface MultiEntityResourceIssue {
  readonly code: MultiEntityResourceIssueCode
  readonly recordType: MultiEntityResourceType
  readonly recordId: string
  readonly relatedId?: string
}

export class MultiEntityResourceOwnershipError extends Error {
  readonly code = 'MULTI_ENTITY_RESOURCE_OWNERSHIP_INVALID'

  constructor(readonly issues: readonly MultiEntityResourceIssue[]) {
    super(`Multi-entity resources contain ${issues.length} ownership issue(s).`)
    this.name = 'MultiEntityResourceOwnershipError'
  }
}

/**
 * Validates the target operational ownership graph without reading or changing
 * Payload, users, roles, memberships or authorization decisions.
 *
 * The resource-only report assumes the topology is validated separately. Use
 * `assertValidMultiEntityResourceOwnership` when a fail-closed assertion over
 * both topology and resources is required. This contract deliberately remains
 * pure and in shadow mode until schema authority and activation are approved.
 */
export function validateMultiEntityResourceOwnership(
  input: MultiEntityOperationalResources
): readonly MultiEntityResourceIssue[] {
  const issues: MultiEntityResourceIssue[] = []
  const legalEntities = new Map(input.topology.legalEntities.map((record) => [record.id, record]))
  const campuses = new Map(input.topology.campuses.map((record) => [record.id, record]))
  const campusBindings = input.topology.campusBindings.filter(
    (binding) => binding.status !== 'inactive'
  )
  const staffAssignments = new Map(
    input.topology.staffAssignments.map((record) => [record.id, record])
  )

  const courses = uniqueResourceMap(input.courses, 'courses', issues)
  const teachers = uniqueResourceMap(input.teachers, 'teachers', issues)
  const classrooms = uniqueResourceMap(input.classrooms, 'classrooms', issues)
  const courseRuns = uniqueResourceMap(input.courseRuns, 'courseRuns', issues)
  uniqueResourceMap(input.enrollments, 'enrollments', issues)
  const campaigns = uniqueResourceMap(input.campaigns, 'campaigns', issues)
  uniqueResourceMap(input.leads, 'leads', issues)
  uniqueResourceMap(input.advertisingSpends, 'advertisingSpends', issues)

  const validateEntity = (
    record: { readonly id: string; readonly tenantId: string; readonly legalEntityId: string },
    recordType: MultiEntityResourceType
  ): boolean => {
    const entity = legalEntities.get(record.legalEntityId)
    if (!entity) {
      issues.push(
        resourceIssue('legal_entity_missing', recordType, record.id, record.legalEntityId)
      )
      return false
    }
    if (entity.tenantId !== record.tenantId) {
      issues.push(resourceIssue('tenant_mismatch', recordType, record.id, entity.id))
      return false
    }
    if (entity.status === 'inactive') {
      issues.push(resourceIssue('legal_entity_inactive', recordType, record.id, entity.id))
      return false
    }
    return true
  }

  const validateCampus = (
    record: { readonly id: string; readonly tenantId: string; readonly legalEntityId: string },
    recordType: MultiEntityResourceType,
    campusId: string
  ): boolean => {
    const campus = campuses.get(campusId)
    if (!campus) {
      issues.push(resourceIssue('campus_missing', recordType, record.id, campusId))
      return false
    }
    if (campus.tenantId !== record.tenantId) {
      issues.push(resourceIssue('tenant_mismatch', recordType, record.id, campusId))
      return false
    }
    const belongsToEntity = campusBindings.some(
      (binding) =>
        binding.tenantId === record.tenantId &&
        binding.legalEntityId === record.legalEntityId &&
        binding.campusId === campusId
    )
    if (!belongsToEntity) {
      issues.push(resourceIssue('campus_out_of_entity', recordType, record.id, campusId))
      return false
    }
    return true
  }

  for (const classroom of input.classrooms) {
    validateEntity(classroom, 'classrooms')
    validateCampus(classroom, 'classrooms', classroom.campusId)
  }

  for (const courseRun of input.courseRuns) {
    validateEntity(courseRun, 'courseRuns')

    const course = courses.get(courseRun.courseId)
    if (!course) {
      issues.push(resourceIssue('course_missing', 'courseRuns', courseRun.id, courseRun.courseId))
    } else if (course.tenantId !== courseRun.tenantId) {
      issues.push(resourceIssue('tenant_mismatch', 'courseRuns', courseRun.id, course.id))
    }

    const campusId = courseRun.campusId ?? null
    if (campusId) validateCampus(courseRun, 'courseRuns', campusId)

    const classroomId = courseRun.classroomId ?? null
    if (classroomId) {
      const classroom = classrooms.get(classroomId)
      if (!campusId) {
        issues.push(
          resourceIssue('classroom_requires_campus', 'courseRuns', courseRun.id, classroomId)
        )
      }
      if (!classroom) {
        issues.push(resourceIssue('classroom_missing', 'courseRuns', courseRun.id, classroomId))
      } else {
        if (
          classroom.tenantId !== courseRun.tenantId ||
          classroom.legalEntityId !== courseRun.legalEntityId
        ) {
          issues.push(
            resourceIssue('classroom_entity_mismatch', 'courseRuns', courseRun.id, classroom.id)
          )
        }
        if (campusId && classroom.campusId !== campusId) {
          issues.push(
            resourceIssue('classroom_campus_mismatch', 'courseRuns', courseRun.id, classroom.id)
          )
        }
      }
    }

    for (const assignmentId of new Set(courseRun.staffAssignmentIds)) {
      const assignment = staffAssignments.get(assignmentId)
      if (!assignment) {
        issues.push(
          resourceIssue('staff_assignment_missing', 'courseRuns', courseRun.id, assignmentId)
        )
        continue
      }
      if (assignment.status === 'suspended') {
        issues.push(
          resourceIssue('staff_assignment_suspended', 'courseRuns', courseRun.id, assignment.id)
        )
      }
      if (
        assignment.tenantId !== courseRun.tenantId ||
        assignment.legalEntityId !== courseRun.legalEntityId
      ) {
        issues.push(
          resourceIssue(
            'staff_assignment_entity_mismatch',
            'courseRuns',
            courseRun.id,
            assignment.id
          )
        )
      }
      if (campusId && assignment.campusIds.length > 0 && !assignment.campusIds.includes(campusId)) {
        issues.push(
          resourceIssue(
            'staff_assignment_campus_mismatch',
            'courseRuns',
            courseRun.id,
            assignment.id
          )
        )
      }
      const teacher = teachers.get(assignment.staffId)
      if (!teacher) {
        issues.push(
          resourceIssue('teacher_missing', 'courseRuns', courseRun.id, assignment.staffId)
        )
      } else if (teacher.tenantId !== courseRun.tenantId) {
        issues.push(resourceIssue('tenant_mismatch', 'courseRuns', courseRun.id, teacher.id))
      }
    }
  }

  for (const enrollment of input.enrollments) {
    validateEntity(enrollment, 'enrollments')
    const courseRun = courseRuns.get(enrollment.courseRunId)
    if (!courseRun) {
      issues.push(
        resourceIssue('course_run_missing', 'enrollments', enrollment.id, enrollment.courseRunId)
      )
    } else if (
      courseRun.tenantId !== enrollment.tenantId ||
      courseRun.legalEntityId !== enrollment.legalEntityId
    ) {
      issues.push(
        resourceIssue('course_run_entity_mismatch', 'enrollments', enrollment.id, courseRun.id)
      )
    }
  }

  for (const campaign of input.campaigns) validateEntity(campaign, 'campaigns')

  for (const lead of input.leads) {
    validateEntity(lead, 'leads')
    if (lead.courseId) {
      const course = courses.get(lead.courseId)
      if (!course) {
        issues.push(resourceIssue('course_missing', 'leads', lead.id, lead.courseId))
      } else if (course.tenantId !== lead.tenantId) {
        issues.push(resourceIssue('tenant_mismatch', 'leads', lead.id, course.id))
      }
    }
    if (lead.campusId) validateCampus(lead, 'leads', lead.campusId)
    if (lead.campaignId) {
      const campaign = campaigns.get(lead.campaignId)
      if (!campaign) {
        issues.push(resourceIssue('campaign_missing', 'leads', lead.id, lead.campaignId))
      } else if (
        campaign.tenantId !== lead.tenantId ||
        campaign.legalEntityId !== lead.legalEntityId
      ) {
        issues.push(resourceIssue('campaign_entity_mismatch', 'leads', lead.id, campaign.id))
      }
    }
  }

  for (const spend of input.advertisingSpends) {
    validateEntity(spend, 'advertisingSpends')
    const campaign = campaigns.get(spend.campaignId)
    if (!campaign) {
      issues.push(
        resourceIssue('campaign_missing', 'advertisingSpends', spend.id, spend.campaignId)
      )
    } else if (
      campaign.tenantId !== spend.tenantId ||
      campaign.legalEntityId !== spend.legalEntityId
    ) {
      issues.push(
        resourceIssue('campaign_entity_mismatch', 'advertisingSpends', spend.id, campaign.id)
      )
    }
  }

  return issues.sort(compareIssues)
}

export function assertValidMultiEntityResourceOwnership(
  input: MultiEntityOperationalResources
): void {
  assertValidMultiEntityTopology(input.topology)
  const issues = validateMultiEntityResourceOwnership(input)
  if (issues.length > 0) throw new MultiEntityResourceOwnershipError(issues)
}

function uniqueResourceMap<T extends { readonly id: string }>(
  records: readonly T[],
  recordType: MultiEntityResourceType,
  issues: MultiEntityResourceIssue[]
): ReadonlyMap<string, T> {
  const recordsById = new Map<string, T>()
  for (const record of records) {
    if (recordsById.has(record.id)) {
      issues.push(resourceIssue('duplicate_record_id', recordType, record.id))
      continue
    }
    recordsById.set(record.id, record)
  }
  return recordsById
}

function resourceIssue(
  code: MultiEntityResourceIssueCode,
  recordType: MultiEntityResourceType,
  recordId: string,
  relatedId?: string
): MultiEntityResourceIssue {
  return relatedId === undefined
    ? { code, recordType, recordId }
    : { code, recordType, recordId, relatedId }
}

function compareIssues(left: MultiEntityResourceIssue, right: MultiEntityResourceIssue): number {
  return (
    left.recordType.localeCompare(right.recordType) ||
    left.recordId.localeCompare(right.recordId) ||
    left.code.localeCompare(right.code) ||
    (left.relatedId ?? '').localeCompare(right.relatedId ?? '')
  )
}

export type MultiEntityRecordStatus = 'proposed' | 'validated' | 'inactive'

export interface LegalEntityTopologyRecord {
  readonly id: string
  readonly tenantId: string
  readonly status: MultiEntityRecordStatus
}

export interface CampusTopologyRecord {
  readonly id: string
  readonly tenantId: string
}

export interface EntityCampusBindingTopologyRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly campusId: string
  readonly status: MultiEntityRecordStatus
}

export interface StaffEntityAssignmentTopologyRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly staffId: string
  readonly campusIds: readonly string[]
  readonly status: 'proposed' | 'validated' | 'suspended'
}

export interface AccountingConnectionTopologyRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly provider: string
  readonly externalCompanyId: string
  readonly secretReference: string
  readonly integrationMode: 'read_only'
  readonly status: 'draft' | 'active' | 'suspended'
}

export interface MultiEntityTopology {
  readonly legalEntities: readonly LegalEntityTopologyRecord[]
  readonly campuses: readonly CampusTopologyRecord[]
  readonly campusBindings: readonly EntityCampusBindingTopologyRecord[]
  readonly staffAssignments: readonly StaffEntityAssignmentTopologyRecord[]
  readonly accountingConnections: readonly AccountingConnectionTopologyRecord[]
}

export type MultiEntityTopologyIssueCode =
  | 'duplicate_record_id'
  | 'legal_entity_missing'
  | 'campus_missing'
  | 'tenant_mismatch'
  | 'campus_multiple_entities'
  | 'staff_assignment_duplicate'
  | 'staff_campus_out_of_entity'
  | 'accounting_company_multiple_entities'
  | 'accounting_secret_reference_invalid'
  | 'accounting_secret_multiple_entities'
  | 'accounting_connection_not_read_only'

export interface MultiEntityTopologyIssue {
  readonly code: MultiEntityTopologyIssueCode
  readonly recordType: keyof MultiEntityTopology
  readonly recordId: string
  readonly relatedId?: string
}

export class MultiEntityTopologyError extends Error {
  readonly code = 'MULTI_ENTITY_TOPOLOGY_INVALID'

  constructor(readonly issues: readonly MultiEntityTopologyIssue[]) {
    super(`Multi-entity topology contains ${issues.length} integrity issue(s).`)
    this.name = 'MultiEntityTopologyError'
  }
}

/**
 * Validates ownership boundaries without reading users, roles or memberships.
 * The function is deterministic and has no database or authorization side effects.
 */
export function validateMultiEntityTopology(
  topology: MultiEntityTopology
): readonly MultiEntityTopologyIssue[] {
  const issues: MultiEntityTopologyIssue[] = []
  const legalEntities = uniqueRecordMap(topology.legalEntities, 'legalEntities', issues)
  const campuses = uniqueRecordMap(topology.campuses, 'campuses', issues)
  uniqueRecordMap(topology.campusBindings, 'campusBindings', issues)
  uniqueRecordMap(topology.staffAssignments, 'staffAssignments', issues)
  uniqueRecordMap(topology.accountingConnections, 'accountingConnections', issues)

  const activeBindingsByCampus = new Map<string, EntityCampusBindingTopologyRecord[]>()

  for (const binding of topology.campusBindings) {
    const entity = legalEntities.get(binding.legalEntityId)
    const campus = campuses.get(binding.campusId)

    if (!entity) {
      issues.push(
        issue('legal_entity_missing', 'campusBindings', binding.id, binding.legalEntityId)
      )
    }
    if (!campus) {
      issues.push(issue('campus_missing', 'campusBindings', binding.id, binding.campusId))
    }
    if (
      (entity && entity.tenantId !== binding.tenantId) ||
      (campus && campus.tenantId !== binding.tenantId)
    ) {
      issues.push(issue('tenant_mismatch', 'campusBindings', binding.id))
    }

    if (binding.status !== 'inactive') {
      const existing = activeBindingsByCampus.get(binding.campusId) ?? []
      existing.push(binding)
      activeBindingsByCampus.set(binding.campusId, existing)
    }
  }

  for (const [campusId, bindings] of activeBindingsByCampus) {
    if (bindings.length > 1) {
      for (const binding of bindings) {
        issues.push(issue('campus_multiple_entities', 'campusBindings', binding.id, campusId))
      }
    }
  }

  const activeStaffAssignments = new Map<string, StaffEntityAssignmentTopologyRecord>()

  for (const assignment of topology.staffAssignments) {
    const entity = legalEntities.get(assignment.legalEntityId)
    if (!entity) {
      issues.push(
        issue('legal_entity_missing', 'staffAssignments', assignment.id, assignment.legalEntityId)
      )
    } else if (entity.tenantId !== assignment.tenantId) {
      issues.push(issue('tenant_mismatch', 'staffAssignments', assignment.id))
    }

    for (const campusId of new Set(assignment.campusIds)) {
      const bindings = activeBindingsByCampus.get(campusId) ?? []
      const belongsToEntity = bindings.some(
        (binding) =>
          binding.tenantId === assignment.tenantId &&
          binding.legalEntityId === assignment.legalEntityId
      )

      if (!belongsToEntity) {
        issues.push(
          issue('staff_campus_out_of_entity', 'staffAssignments', assignment.id, campusId)
        )
      }
    }

    if (assignment.status !== 'suspended') {
      const key = `${assignment.tenantId}\u0000${assignment.legalEntityId}\u0000${assignment.staffId}`
      const existing = activeStaffAssignments.get(key)
      if (existing) {
        issues.push(
          issue('staff_assignment_duplicate', 'staffAssignments', assignment.id, existing.id)
        )
      } else {
        activeStaffAssignments.set(key, assignment)
      }
    }
  }

  const accountingCompanies = new Map<string, AccountingConnectionTopologyRecord>()
  const accountingSecrets = new Map<string, AccountingConnectionTopologyRecord>()

  for (const connection of topology.accountingConnections) {
    const entity = legalEntities.get(connection.legalEntityId)
    if (!entity) {
      issues.push(
        issue(
          'legal_entity_missing',
          'accountingConnections',
          connection.id,
          connection.legalEntityId
        )
      )
    } else if (entity.tenantId !== connection.tenantId) {
      issues.push(issue('tenant_mismatch', 'accountingConnections', connection.id))
    }

    if (connection.integrationMode !== 'read_only') {
      issues.push(
        issue('accounting_connection_not_read_only', 'accountingConnections', connection.id)
      )
    }

    if (!validSecretReference(connection.secretReference)) {
      issues.push(
        issue('accounting_secret_reference_invalid', 'accountingConnections', connection.id)
      )
    }

    if (connection.status === 'suspended') continue

    const key = `${connection.tenantId}\u0000${connection.provider}\u0000${connection.externalCompanyId}`
    const existing = accountingCompanies.get(key)

    if (existing && existing.legalEntityId !== connection.legalEntityId) {
      issues.push(
        issue(
          'accounting_company_multiple_entities',
          'accountingConnections',
          connection.id,
          existing.id
        )
      )
    } else if (!existing) {
      accountingCompanies.set(key, connection)
    }

    if (validSecretReference(connection.secretReference)) {
      const secretOwner = accountingSecrets.get(connection.secretReference)
      if (secretOwner && secretOwner.legalEntityId !== connection.legalEntityId) {
        issues.push(
          issue(
            'accounting_secret_multiple_entities',
            'accountingConnections',
            connection.id,
            secretOwner.id
          )
        )
      } else if (!secretOwner) {
        accountingSecrets.set(connection.secretReference, connection)
      }
    }
  }

  return issues
}

const SECRET_REFERENCE_PATTERN = /^(?:op|vault|aws-sm|gcp-sm):\/\/[A-Za-z0-9][^\s]{2,497}$/

function validSecretReference(value: string): boolean {
  return SECRET_REFERENCE_PATTERN.test(value)
}

export function assertValidMultiEntityTopology(topology: MultiEntityTopology): void {
  const issues = validateMultiEntityTopology(topology)
  if (issues.length > 0) throw new MultiEntityTopologyError(issues)
}

function uniqueRecordMap<T extends { readonly id: string }>(
  records: readonly T[],
  recordType: keyof MultiEntityTopology,
  issues: MultiEntityTopologyIssue[]
): ReadonlyMap<string, T> {
  const recordsById = new Map<string, T>()

  for (const record of records) {
    if (recordsById.has(record.id)) {
      issues.push(issue('duplicate_record_id', recordType, record.id))
      continue
    }
    recordsById.set(record.id, record)
  }

  return recordsById
}

function issue(
  code: MultiEntityTopologyIssueCode,
  recordType: keyof MultiEntityTopology,
  recordId: string,
  relatedId?: string
): MultiEntityTopologyIssue {
  return relatedId === undefined
    ? { code, recordType, recordId }
    : { code, recordType, recordId, relatedId }
}

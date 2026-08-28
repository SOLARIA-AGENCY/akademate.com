/**
 * Canonical foundation types for Akademate P0.
 * Spec 2, 3, 5, 21, 23, 24. Plan, deployment, blueprint and organization
 * model are independent dimensions.
 */

export type TenantId = string
export type OrganizationGroupId = string
export type PersonId = string
export type LegalEntityId = string
export type LocationId = string
export type CampusId = string
export type CorrelationId = string

/** Stored plan enum stays starter/pro/enterprise. Commercial names follow the spec. */
export const CommercialPlan = {
  LAUNCH: 'launch',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const
export type CommercialPlan = (typeof CommercialPlan)[keyof typeof CommercialPlan]

export const StoredPlan = {
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const
export type StoredPlan = (typeof StoredPlan)[keyof typeof StoredPlan]

export const DeploymentMode = {
  MANAGED_CLOUD: 'managed_cloud',
  DEDICATED_CLOUD: 'dedicated_cloud',
  ON_PREMISE: 'on_premise',
} as const
export type DeploymentMode = (typeof DeploymentMode)[keyof typeof DeploymentMode]

export const OrganizationModel = {
  SINGLE_TENANT: 'single_tenant',
  MULTI_LOCATION: 'multi_location',
  MULTI_TENANT_GROUP: 'multi_tenant_group',
  FRANCHISE: 'franchise',
} as const
export type OrganizationModel = (typeof OrganizationModel)[keyof typeof OrganizationModel]

export const BlueprintKey = {
  PROFESSIONAL_TRAINING: 'professional_training',
  WELLNESS: 'wellness',
  SPORTS: 'sports',
  CAMPS: 'camps',
  MUSIC_DANCE: 'music_dance',
  ONLINE_COHORTS: 'online_cohorts',
  LANGUAGES: 'languages',
  CODING_ACADEMY: 'coding_academy',
  TUTORING: 'tutoring',
  CERTIFICATION: 'certification',
  DRIVING_SCHOOL: 'driving_school',
} as const
export type BlueprintKey = (typeof BlueprintKey)[keyof typeof BlueprintKey]

export const ActorType = {
  HUMAN: 'human',
  AI_AGENT: 'ai_agent',
  SERVICE: 'service',
  DEVICE: 'device',
} as const
export type ActorType = (typeof ActorType)[keyof typeof ActorType]

export const ActorChannel = {
  WEB: 'web',
  API: 'api',
  MCP: 'mcp',
  WORKER: 'worker',
  ADMIN: 'admin',
  OPS: 'ops',
} as const
export type ActorChannel = (typeof ActorChannel)[keyof typeof ActorChannel]

export const PolicyKind = {
  ATTENDANCE: 'attendance',
  CANCELLATION: 'cancellation',
  ACCESS: 'access',
  PAYMENT: 'payment',
  AI: 'ai',
  PRIVACY: 'privacy',
  CAMPUS_ADOPTION: 'campus_adoption',
  OTHER: 'other',
} as const
export type PolicyKind = (typeof PolicyKind)[keyof typeof PolicyKind]

export const FeatureFlagPurpose = {
  ROLLOUT: 'rollout',
  EXPERIMENT: 'experiment',
} as const
export type FeatureFlagPurpose = (typeof FeatureFlagPurpose)[keyof typeof FeatureFlagPurpose]

export const LocationKind = {
  PHYSICAL: 'physical',
  VIRTUAL: 'virtual',
  MOBILE: 'mobile',
} as const
export type LocationKind = (typeof LocationKind)[keyof typeof LocationKind]

export const CampusKind = {
  PHYSICAL: 'physical',
  VIRTUAL: 'virtual',
  HYBRID: 'hybrid',
} as const
export type CampusKind = (typeof CampusKind)[keyof typeof CampusKind]

/** Appendix B capability keys. Product modules, not rollout flags. */
export const CapabilityKey = {
  ACADEMIC_COURSES: 'academic.courses',
  ACADEMIC_PHASES: 'academic.phases',
  ACADEMIC_RECURRING_SESSIONS: 'academic.recurring_sessions',
  ACADEMIC_ONE_TO_ONE: 'academic.one_to_one',
  ACADEMIC_MULTI_INSTRUCTOR: 'academic.multi_instructor',
  ACADEMIC_EXTERNAL_PRACTICES: 'academic.external_practices',
  ACADEMIC_REGULATED_PROGRAMMES: 'academic.regulated_programmes',
  ACADEMIC_LEVELS: 'academic.levels',
  ACADEMIC_TEAMS: 'academic.teams',
  ACADEMIC_SEASONS: 'academic.seasons',
  ACADEMIC_GUARDIANS: 'academic.guardians',
  RESOURCES_ROOMS: 'resources.rooms',
  RESOURCES_VEHICLES: 'resources.vehicles',
  RESOURCES_EXTERNAL_VENUES: 'resources.external_venues',
  RESOURCES_TRAVEL_CONSTRAINTS: 'resources.travel_constraints',
  COMMERCE_MEMBERSHIPS: 'commerce.memberships',
  COMMERCE_SESSION_PACKS: 'commerce.session_packs',
  COMMERCE_STORE: 'commerce.store',
  COMMERCE_EVENTS: 'commerce.events',
  FINANCE_ADVANCED: 'finance.advanced',
  FINANCE_MULTI_PAYER: 'finance.multi_payer',
  FINANCE_FUNDING: 'finance.funding',
  LEARNING_LMS: 'learning.lms',
  LEARNING_VIDEO: 'learning.video',
  ASSESSMENT_TESTS: 'assessment.tests',
  ASSESSMENT_EXAMS: 'assessment.exams',
  CREDENTIALS_DIGITAL: 'credentials.digital',
  ACCESS_QR: 'access.qr',
  ACCESS_NFC: 'access.nfc',
  COMMUNICATION_IN_APP: 'communication.in_app',
  INTEGRATIONS_API: 'integrations.api',
  INTEGRATIONS_WEBHOOKS: 'integrations.webhooks',
  AGENTS_MCP: 'agents.mcp',
  AGENTS_WEBMCP: 'agents.webmcp',
  AGENTS_AI_ASSISTANT: 'agents.ai_assistant',
  ORGANIZATION_MULTI_TENANT_GROUP: 'organization.multi_tenant_group',
  ORGANIZATION_FRANCHISE: 'organization.franchise',
  PLATFORM_SEASONAL_STANDBY: 'platform.seasonal_standby',
} as const
export type CapabilityKey = (typeof CapabilityKey)[keyof typeof CapabilityKey]

export type PolicyDecision = 'allow' | 'deny' | 'preview'

export interface ActorContext {
  actorType: ActorType
  actorId: string
  delegatedBy?: string
  accountId?: OrganizationGroupId
  tenantId?: TenantId
  purpose: string
  channel: ActorChannel
  correlationId: CorrelationId
  timestamp: Date
  policyDecision?: PolicyDecision
  roles?: string[]
}

export interface TenantPlacement {
  regionId: string
  cellId: string
  deploymentId: string
}

export interface TenantDimensions {
  plan: StoredPlan
  commercialPlan: CommercialPlan
  deploymentMode: DeploymentMode
  blueprintKey: BlueprintKey | string
  blueprintVersion: number
  organizationModel: OrganizationModel
  placement: TenantPlacement
}

export interface AuditEvent {
  tenantId?: TenantId
  organizationGroupId?: OrganizationGroupId
  actorId: string
  actorType: ActorType
  action: string
  resource: string
  resourceId: string
  purpose?: string
  correlationId: CorrelationId
  channel?: ActorChannel
  policyDecision?: PolicyDecision
  createdAt: Date
  metadata?: Record<string, unknown>
}

export interface CapabilityRecord {
  key: CapabilityKey | string
  enabled: boolean
  source: 'blueprint' | 'plan' | 'override'
}

export interface FeatureFlagRecord {
  key: string
  purpose: FeatureFlagPurpose
  defaultValue: unknown
  overrides: { tenantId: string; value: unknown }[]
  planRequirement?: StoredPlan | null
}

const STORED_TO_COMMERCIAL: Record<StoredPlan, CommercialPlan> = {
  starter: CommercialPlan.LAUNCH,
  pro: CommercialPlan.BUSINESS,
  enterprise: CommercialPlan.ENTERPRISE,
}

const COMMERCIAL_TO_STORED: Record<CommercialPlan, StoredPlan> = {
  launch: StoredPlan.STARTER,
  business: StoredPlan.PRO,
  enterprise: StoredPlan.ENTERPRISE,
}

export function commercialPlanFromStored(plan: StoredPlan): CommercialPlan {
  return STORED_TO_COMMERCIAL[plan]
}

export function storedPlanFromCommercial(plan: CommercialPlan): StoredPlan {
  return COMMERCIAL_TO_STORED[plan]
}

export function isStoredPlan(value: string): value is StoredPlan {
  return value === 'starter' || value === 'pro' || value === 'enterprise'
}

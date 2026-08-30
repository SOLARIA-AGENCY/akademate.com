import type { CapabilityKey, CapabilityRecord, FeatureFlagRecord, FeatureFlagPurpose } from '@akademate/types'
import { CapabilityKey as Keys } from '@akademate/types'

const PROFESSIONAL_TRAINING_DEFAULTS: string[] = [
  Keys.ACADEMIC_COURSES,
  Keys.ACADEMIC_PHASES,
  Keys.ACADEMIC_REGULATED_PROGRAMMES,
  Keys.ACADEMIC_EXTERNAL_PRACTICES,
  Keys.RESOURCES_ROOMS,
  Keys.FINANCE_FUNDING,
  Keys.LEARNING_LMS,
  Keys.ASSESSMENT_EXAMS,
  Keys.CREDENTIALS_DIGITAL,
]

const WELLNESS_DEFAULTS: string[] = [
  Keys.ACADEMIC_RECURRING_SESSIONS,
  Keys.COMMERCE_MEMBERSHIPS,
  Keys.COMMERCE_SESSION_PACKS,
  Keys.RESOURCES_ROOMS,
]

const BLUEPRINT_DEFAULTS: Record<string, string[]> = {
  professional_training: PROFESSIONAL_TRAINING_DEFAULTS,
  wellness: WELLNESS_DEFAULTS,
}

export function blueprintDefaultCapabilities(blueprintKey: string): string[] {
  return BLUEPRINT_DEFAULTS[blueprintKey] ?? [Keys.ACADEMIC_COURSES]
}

export function resolveCapability(input: {
  capabilityKey: CapabilityKey | string
  blueprintKey: string
  overrides: CapabilityRecord[]
}): boolean {
  const override = input.overrides.find((item) => item.key === input.capabilityKey)
  if (override) return override.enabled
  return blueprintDefaultCapabilities(input.blueprintKey).includes(input.capabilityKey)
}

export function isProductCapability(key: string): boolean {
  return Object.values(Keys).includes(key as CapabilityKey)
}

export function isRolloutFlag(flag: FeatureFlagRecord): boolean {
  const purpose: FeatureFlagPurpose = flag.purpose
  return purpose === 'rollout' || purpose === 'experiment'
}

export function assertNotUsedAsCapability(flag: FeatureFlagRecord): void {
  if (isProductCapability(flag.key)) {
    throw new Error(
      `Feature flag "${flag.key}" collides with a product capability. Capabilities are product. Flags are rollout only.`,
    )
  }
}

export const CAPABILITY_CATALOG: { key: string; description: string; category: string }[] = [
  { key: Keys.ACADEMIC_COURSES, description: 'cursos/cohortes', category: 'academic' },
  { key: Keys.ACADEMIC_PHASES, description: 'fases', category: 'academic' },
  { key: Keys.ACADEMIC_RECURRING_SESSIONS, description: 'sesiones recurrentes', category: 'academic' },
  { key: Keys.ACADEMIC_ONE_TO_ONE, description: '1:1', category: 'academic' },
  { key: Keys.ACADEMIC_MULTI_INSTRUCTOR, description: 'varios docentes', category: 'academic' },
  { key: Keys.ACADEMIC_EXTERNAL_PRACTICES, description: 'practicas externas', category: 'academic' },
  { key: Keys.ACADEMIC_REGULATED_PROGRAMMES, description: 'formacion regulada', category: 'academic' },
  { key: Keys.ACADEMIC_LEVELS, description: 'niveles', category: 'academic' },
  { key: Keys.ACADEMIC_TEAMS, description: 'equipos', category: 'academic' },
  { key: Keys.ACADEMIC_SEASONS, description: 'temporadas', category: 'academic' },
  { key: Keys.ACADEMIC_GUARDIANS, description: 'tutores/menores', category: 'academic' },
  { key: Keys.RESOURCES_ROOMS, description: 'aulas', category: 'resources' },
  { key: Keys.RESOURCES_VEHICLES, description: 'vehiculos', category: 'resources' },
  { key: Keys.RESOURCES_EXTERNAL_VENUES, description: 'venues externos', category: 'resources' },
  { key: Keys.RESOURCES_TRAVEL_CONSTRAINTS, description: 'desplazamientos', category: 'resources' },
  { key: Keys.COMMERCE_MEMBERSHIPS, description: 'membresias', category: 'commerce' },
  { key: Keys.COMMERCE_SESSION_PACKS, description: 'bonos', category: 'commerce' },
  { key: Keys.COMMERCE_STORE, description: 'tienda', category: 'commerce' },
  { key: Keys.COMMERCE_EVENTS, description: 'eventos/clinics', category: 'commerce' },
  { key: Keys.FINANCE_ADVANCED, description: 'finanzas avanzadas', category: 'finance' },
  { key: Keys.FINANCE_MULTI_PAYER, description: 'varios pagadores', category: 'finance' },
  { key: Keys.FINANCE_FUNDING, description: 'becas/subvenciones', category: 'finance' },
  { key: Keys.LEARNING_LMS, description: 'contenido/campus learning', category: 'learning' },
  { key: Keys.LEARNING_VIDEO, description: 'video', category: 'learning' },
  { key: Keys.ASSESSMENT_TESTS, description: 'tests', category: 'assessment' },
  { key: Keys.ASSESSMENT_EXAMS, description: 'examenes', category: 'assessment' },
  { key: Keys.CREDENTIALS_DIGITAL, description: 'credenciales digitales', category: 'credentials' },
  { key: Keys.ACCESS_QR, description: 'QR', category: 'access' },
  { key: Keys.ACCESS_NFC, description: 'NFC', category: 'access' },
  { key: Keys.COMMUNICATION_IN_APP, description: 'mensajeria interna', category: 'communication' },
  { key: Keys.INTEGRATIONS_API, description: 'API', category: 'integrations' },
  { key: Keys.INTEGRATIONS_WEBHOOKS, description: 'webhooks', category: 'integrations' },
  { key: Keys.AGENTS_MCP, description: 'MCP', category: 'agents' },
  { key: Keys.AGENTS_WEBMCP, description: 'WebMCP', category: 'agents' },
  { key: Keys.AGENTS_AI_ASSISTANT, description: 'asistentes IA', category: 'agents' },
  { key: Keys.ORGANIZATION_MULTI_TENANT_GROUP, description: 'grupos multiempresa', category: 'organization' },
  { key: Keys.ORGANIZATION_FRANCHISE, description: 'franquicia', category: 'organization' },
  { key: Keys.PLATFORM_SEASONAL_STANDBY, description: 'standby estacional', category: 'platform' },
]

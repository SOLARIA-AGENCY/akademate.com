import type { Access, CollectionBeforeValidateHook, CollectionConfig, Field } from 'payload'

export const CEP_MULTI_ENTITY_SHADOW_FLAG = 'CEP_MULTI_ENTITY_SHADOW_SCHEMA_ENABLED'
export const CEP_MULTI_ENTITY_SHADOW_ENVIRONMENT = 'CEP_MULTI_ENTITY_SHADOW_ENVIRONMENT'

type ShadowEnvironment = Record<string, string | undefined>

const nonProductionEnvironments = new Set(['development', 'local', 'staging', 'test'])

export function resolveCepMultiEntityShadowGate(env: ShadowEnvironment = process.env): {
  enabled: boolean
  reason: 'disabled' | 'environment-not-allowed' | 'enabled'
} {
  if (env[CEP_MULTI_ENTITY_SHADOW_FLAG] !== 'true') {
    return { enabled: false, reason: 'disabled' }
  }

  const environment = env[CEP_MULTI_ENTITY_SHADOW_ENVIRONMENT]?.trim().toLowerCase()
  if (!environment || !nonProductionEnvironments.has(environment)) {
    return { enabled: false, reason: 'environment-not-allowed' }
  }

  return { enabled: true, reason: 'enabled' }
}

export const denyShadowAccess: Access = () => false

const shadowAccess: NonNullable<CollectionConfig['access']> = {
  read: denyShadowAccess,
  create: denyShadowAccess,
  update: denyShadowAccess,
  delete: denyShadowAccess,
}

const shadowAdmin: NonNullable<CollectionConfig['admin']> = {
  hidden: true,
  group: 'CEP Multi-entity Shadow',
}

const tenantField = (): Field => ({
  name: 'tenant',
  type: 'relationship',
  relationTo: 'tenants',
  required: true,
  index: true,
})

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? id : null
  }
  return null
}

export function validateCampusEntityBinding(data: Record<string, unknown> | null | undefined): void {
  const primaryId = relationId(data?.primary_legal_entity)
  const legalEntityIds = Array.isArray(data?.legal_entities)
    ? data.legal_entities.map(relationId).filter((id): id is string | number => id !== null)
    : []

  if (primaryId === null || !legalEntityIds.some((id) => String(id) === String(primaryId))) {
    throw new Error('Primary legal entity must be included in the campus legal entities')
  }
}

export function validateEmploymentAllocations(data: Record<string, unknown> | null | undefined): void {
  const allocations = Array.isArray(data?.allocations) ? data.allocations : []
  const percentages = allocations.map((allocation) => {
    if (!allocation || typeof allocation !== 'object') return Number.NaN
    return Number((allocation as { percentage?: unknown }).percentage)
  })

  if (
    percentages.length === 0
    || percentages.some((percentage) => !Number.isFinite(percentage) || percentage <= 0 || percentage > 100)
    || Math.abs(percentages.reduce((sum, percentage) => sum + percentage, 0) - 100) > 0.001
  ) {
    throw new Error('Staff employment allocations must contain percentages greater than 0 and total exactly 100')
  }
}

const validateCampusEntityBindingHook: CollectionBeforeValidateHook = ({ data }) => {
  validateCampusEntityBinding(data)
  return data
}

const validateEmploymentAllocationsHook: CollectionBeforeValidateHook = ({ data }) => {
  validateEmploymentAllocations(data)
  return data
}

export const LegalEntitiesShadow: CollectionConfig = {
  slug: 'legal-entities-shadow',
  labels: { singular: 'Entidad juridica (shadow)', plural: 'Entidades juridicas (shadow)' },
  admin: { ...shadowAdmin, useAsTitle: 'name' },
  access: shadowAccess,
  fields: [
    { name: 'code', type: 'text', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Sociedad', value: 'company' },
        { label: 'Asociacion', value: 'association' },
        { label: 'Autonomo', value: 'sole_trader' },
        { label: 'Otra', value: 'other' },
      ],
    },
    { name: 'tax_identifier', type: 'text' },
    { name: 'active', type: 'checkbox', required: true, defaultValue: true },
    tenantField(),
  ],
  timestamps: true,
}

export const CampusEntityBindingsShadow: CollectionConfig = {
  slug: 'campus-entity-bindings-shadow',
  labels: { singular: 'Vinculo campus-entidad (shadow)', plural: 'Vinculos campus-entidad (shadow)' },
  admin: shadowAdmin,
  access: shadowAccess,
  hooks: { beforeValidate: [validateCampusEntityBindingHook] },
  fields: [
    {
      name: 'campus',
      type: 'relationship',
      relationTo: 'campuses',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Campus fisico existente; no representa una entidad juridica' },
    },
    {
      name: 'legal_entities',
      type: 'relationship',
      relationTo: 'legal-entities-shadow',
      hasMany: true,
      required: true,
      minRows: 1,
    },
    {
      name: 'primary_legal_entity',
      type: 'relationship',
      relationTo: 'legal-entities-shadow',
      required: true,
      index: true,
      admin: { description: 'Una y solo una entidad juridica primaria para este campus' },
    },
    tenantField(),
  ],
  timestamps: true,
}

export const OperationalScopesShadow: CollectionConfig = {
  slug: 'operational-scopes-shadow',
  labels: { singular: 'Ambito operativo (shadow)', plural: 'Ambitos operativos (shadow)' },
  admin: { ...shadowAdmin, useAsTitle: 'name' },
  access: shadowAccess,
  fields: [
    { name: 'code', type: 'text', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    {
      name: 'legal_entity',
      type: 'relationship',
      relationTo: 'legal-entities-shadow',
      required: true,
      index: true,
    },
    {
      name: 'campuses',
      type: 'relationship',
      relationTo: 'campuses',
      hasMany: true,
      admin: { description: 'Cobertura fisica opcional; el ambito sigue siendo operativo' },
    },
    {
      name: 'purpose',
      type: 'select',
      required: true,
      options: [
        { label: 'Academico', value: 'academic' },
        { label: 'Personas', value: 'people' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Finanzas', value: 'finance' },
        { label: 'General', value: 'general' },
      ],
    },
    { name: 'active', type: 'checkbox', required: true, defaultValue: true },
    tenantField(),
  ],
  timestamps: true,
}

export const StaffEmploymentsShadow: CollectionConfig = {
  slug: 'staff-employments-shadow',
  labels: { singular: 'Relacion laboral (shadow)', plural: 'Relaciones laborales (shadow)' },
  admin: shadowAdmin,
  access: shadowAccess,
  hooks: { beforeValidate: [validateEmploymentAllocationsHook] },
  fields: [
    {
      name: 'staff',
      type: 'relationship',
      relationTo: 'staff',
      required: true,
      index: true,
      admin: { description: 'Referencia al maestro compartido de personal/profesores' },
    },
    {
      name: 'employer_legal_entity',
      type: 'relationship',
      relationTo: 'legal-entities-shadow',
      required: true,
      index: true,
    },
    {
      name: 'allocations',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'operational_scope',
          type: 'relationship',
          relationTo: 'operational-scopes-shadow',
          required: true,
        },
        {
          name: 'percentage',
          type: 'number',
          required: true,
          min: 0.01,
          max: 100,
        },
      ],
    },
    { name: 'starts_on', type: 'date', required: true },
    { name: 'ends_on', type: 'date' },
    tenantField(),
  ],
  timestamps: true,
}

export const CourseRunScopesShadow: CollectionConfig = {
  slug: 'course-run-scopes-shadow',
  labels: { singular: 'Ambitos de convocatoria (shadow)', plural: 'Ambitos de convocatorias (shadow)' },
  admin: shadowAdmin,
  access: shadowAccess,
  fields: [
    {
      name: 'course_run',
      type: 'relationship',
      relationTo: 'course-runs',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'La convocatoria conserva el curso maestro compartido existente' },
    },
    { name: 'owner_scope', type: 'relationship', relationTo: 'operational-scopes-shadow', index: true },
    { name: 'manager_scope', type: 'relationship', relationTo: 'operational-scopes-shadow', index: true },
    { name: 'funder_scope', type: 'relationship', relationTo: 'operational-scopes-shadow', index: true },
    tenantField(),
  ],
  timestamps: true,
}

export const FinanceConnectionsShadow: CollectionConfig = {
  slug: 'finance-connections-shadow',
  labels: { singular: 'Conexion financiera (shadow)', plural: 'Conexiones financieras (shadow)' },
  admin: shadowAdmin,
  access: shadowAccess,
  fields: [
    {
      name: 'legal_entity',
      type: 'relationship',
      relationTo: 'legal-entities-shadow',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'La conexion solo puede consultar datos de esta entidad juridica' },
    },
    { name: 'provider', type: 'text', required: true },
    {
      name: 'external_reference',
      type: 'text',
      required: true,
      admin: { description: 'Identificador no secreto; las credenciales no se almacenan aqui' },
    },
    {
      name: 'read_only',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      validate: (value: boolean | null | undefined) => value === true || 'Finance shadow connections must remain read-only',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'disabled',
      options: [
        { label: 'Deshabilitada', value: 'disabled' },
        { label: 'Configurada', value: 'configured' },
        { label: 'Error', value: 'error' },
      ],
    },
    tenantField(),
  ],
  timestamps: true,
}

export const cepMultiEntityShadowCollections: CollectionConfig[] = [
  LegalEntitiesShadow,
  CampusEntityBindingsShadow,
  OperationalScopesShadow,
  StaffEmploymentsShadow,
  CourseRunScopesShadow,
  FinanceConnectionsShadow,
]

export function getCepMultiEntityShadowCollections(env: ShadowEnvironment = process.env): CollectionConfig[] {
  return resolveCepMultiEntityShadowGate(env).enabled ? cepMultiEntityShadowCollections : []
}

import type { Access, CollectionConfig, CollectionSlug, Field, FieldAccess } from 'payload'
import { isAccountingSecretReference } from '../../../../packages/finance/src'

const denyAllAccess: Access = () => false
const denyAllFieldAccess: FieldAccess = () => false

const shadowAccess: NonNullable<CollectionConfig['access']> = {
  read: denyAllAccess,
  create: denyAllAccess,
  update: denyAllAccess,
  delete: denyAllAccess,
}

const tenantField: Field = {
  name: 'tenant',
  type: 'relationship',
  relationTo: 'tenants',
  required: true,
  index: true,
}

const legalEntityField: Field = {
  name: 'legalEntity',
  type: 'relationship',
  // The generated Payload union cannot include this gated collection until the
  // schema-authority decision permits a deliberate type-generation pass.
  relationTo: 'cep-legal-entities' as CollectionSlug,
  required: true,
  index: true,
}

const shadowAdmin = {
  hidden: true,
  group: 'CEP multi-entidad (sombra)',
} as const

export const CepLegalEntitiesShadow: CollectionConfig = {
  slug: 'cep-legal-entities',
  admin: {
    ...shadowAdmin,
    useAsTitle: 'legalName',
  },
  access: shadowAccess,
  fields: [
    tenantField,
    {
      name: 'code',
      type: 'text',
      required: true,
      index: true,
      maxLength: 64,
    },
    {
      name: 'legalName',
      type: 'text',
      required: true,
      maxLength: 255,
    },
    {
      name: 'taxId',
      type: 'text',
      required: true,
      maxLength: 32,
      access: {
        read: denyAllFieldAccess,
        update: denyAllFieldAccess,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Validada', value: 'validated' },
        { label: 'Inactiva', value: 'inactive' },
      ],
    },
  ],
  timestamps: true,
}

export const CepEntityCampusBindingsShadow: CollectionConfig = {
  slug: 'cep-entity-campus-bindings',
  admin: shadowAdmin,
  access: shadowAccess,
  fields: [
    tenantField,
    legalEntityField,
    {
      name: 'campus',
      type: 'relationship',
      relationTo: 'campuses',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'proposed',
      options: [
        { label: 'Propuesta', value: 'proposed' },
        { label: 'Validada', value: 'validated' },
        { label: 'Inactiva', value: 'inactive' },
      ],
    },
  ],
  timestamps: true,
}

export const CepStaffEntityAssignmentsShadow: CollectionConfig = {
  slug: 'cep-staff-entity-assignments',
  admin: shadowAdmin,
  access: shadowAccess,
  fields: [
    tenantField,
    legalEntityField,
    {
      name: 'staff',
      type: 'relationship',
      relationTo: 'staff',
      required: true,
      index: true,
    },
    {
      name: 'campuses',
      type: 'relationship',
      relationTo: 'campuses',
      hasMany: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'proposed',
      options: [
        { label: 'Propuesta', value: 'proposed' },
        { label: 'Validada', value: 'validated' },
        { label: 'Suspendida', value: 'suspended' },
      ],
    },
    {
      name: 'availableFrom',
      type: 'date',
    },
    {
      name: 'availableUntil',
      type: 'date',
    },
    {
      name: 'agreementReference',
      type: 'text',
      maxLength: 255,
      access: {
        read: denyAllFieldAccess,
        update: denyAllFieldAccess,
      },
    },
  ],
  timestamps: true,
}

export const CepAccountingConnectionsShadow: CollectionConfig = {
  slug: 'cep-accounting-connections',
  admin: shadowAdmin,
  access: shadowAccess,
  fields: [
    tenantField,
    legalEntityField,
    {
      name: 'provider',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'externalCompanyId',
      type: 'text',
      required: true,
      maxLength: 255,
    },
    {
      name: 'secretReference',
      type: 'text',
      required: true,
      maxLength: 500,
      validate: validateSecretReference,
      access: {
        read: denyAllFieldAccess,
        update: denyAllFieldAccess,
      },
    },
    {
      name: 'integrationMode',
      type: 'select',
      required: true,
      defaultValue: 'read_only',
      options: [{ label: 'Solo lectura', value: 'read_only' }],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Activa', value: 'active' },
        { label: 'Suspendida', value: 'suspended' },
      ],
    },
  ],
  timestamps: true,
}

export const CEP_MULTI_ENTITY_SHADOW_COLLECTIONS = [
  CepLegalEntitiesShadow,
  CepEntityCampusBindingsShadow,
  CepStaffEntityAssignmentsShadow,
  CepAccountingConnectionsShadow,
] as const satisfies readonly CollectionConfig[]

export function validateSecretReference(value: unknown): true | string {
  if (!isAccountingSecretReference(value)) {
    return 'Use una referencia op://, vault://, aws-sm:// o gcp-sm://; nunca guarde la credencial.'
  }

  return true
}

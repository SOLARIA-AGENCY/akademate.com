import type { CollectionConfig } from 'payload'
import { internalOrganizationAccess, tenantField, validateSameTenantRelationships } from './common'

export const FinanceEntries: CollectionConfig = {
  slug: 'finance-entries',
  labels: { singular: 'Apunte financiero', plural: 'Apuntes financieros' },
  admin: {
    useAsTitle: 'reference', group: 'Finanzas internas',
    defaultColumns: ['date', 'type', 'legal_entity', 'campus', 'amount', 'status'],
    description: 'Contabilidad operativa separada de la facturacion SaaS de Akademate.',
  },
  access: internalOrganizationAccess,
  fields: [
    { name: 'reference', type: 'text', required: true, index: true },
    { name: 'date', type: 'date', required: true, index: true },
    {
      name: 'type', type: 'select', required: true, index: true,
      options: [
        { label: 'Ingreso', value: 'income' }, { label: 'Gasto', value: 'expense' },
        { label: 'Nomina', value: 'payroll' }, { label: 'Subvencion', value: 'subsidy' },
        { label: 'Intercompany', value: 'intercompany' }, { label: 'Ajuste', value: 'adjustment' },
      ],
    },
    { name: 'legal_entity', type: 'relationship', relationTo: 'legal-entities', required: true, index: true },
    { name: 'counterparty_legal_entity', type: 'relationship', relationTo: 'legal-entities', index: true },
    { name: 'campus', type: 'relationship', relationTo: 'campuses', index: true },
    { name: 'operating_scope', type: 'relationship', relationTo: 'operating-scopes', index: true },
    { name: 'course_run', type: 'relationship', relationTo: 'course-runs', index: true },
    { name: 'amount', type: 'number', required: true, min: 0 },
    { name: 'currency', type: 'text', required: true, defaultValue: 'EUR' },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'draft', index: true,
      options: [{ label: 'Borrador', value: 'draft' }, { label: 'Contabilizado', value: 'posted' }, { label: 'Anulado', value: 'void' }],
    },
    { name: 'description', type: 'textarea' },
    { name: 'metadata', type: 'json', admin: { description: 'Metadatos sin secretos ni datos bancarios.' } },
    tenantField,
  ],
  hooks: { beforeValidate: [validateSameTenantRelationships([
    { field: 'legal_entity', collection: 'legal-entities' },
    { field: 'counterparty_legal_entity', collection: 'legal-entities' },
    { field: 'campus', collection: 'campuses' },
    { field: 'operating_scope', collection: 'operating-scopes' },
    { field: 'course_run', collection: 'course-runs' },
  ])] },
  timestamps: true,
}

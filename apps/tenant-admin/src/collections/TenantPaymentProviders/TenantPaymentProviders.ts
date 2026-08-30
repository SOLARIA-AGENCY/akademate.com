import type { CollectionConfig } from 'payload'
import { isAdminOrHigher, tenantField } from '../../access/tenantAccess'

const manageAccess = ({ req }: { req: { user?: { role?: string } | null } }) => {
  if (!req.user) return false
  return ['admin', 'gestor', 'superadmin'].includes(req.user.role ?? '')
}

export const TenantPaymentProviders: CollectionConfig = {
  slug: 'tenant-payment-providers',
  labels: { singular: 'Proveedor de pagos', plural: 'Proveedores de pagos' },
  admin: {
    useAsTitle: 'status',
    group: 'Sistema',
    description: 'Conexión Stripe de pagos de alumnos por academia. Los secretos no se muestran.',
    hidden: true,
    defaultColumns: ['tenant', 'status', 'livemode', 'updatedAt'],
  },
  access: {
    read: manageAccess,
    create: manageAccess,
    update: manageAccess,
    delete: ({ req }) => Boolean(req.user && isAdminOrHigher(req.user)),
  },
  fields: [
    tenantField,
    {
      name: 'provider',
      type: 'text',
      defaultValue: 'stripe',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'disconnected',
      options: [
        { label: 'Desconectado', value: 'disconnected' },
        { label: 'Conectado', value: 'connected' },
      ],
      index: true,
    },
    {
      name: 'publishable_key',
      type: 'text',
      admin: { description: 'Clave publicable pk_ del cliente' },
    },
    {
      name: 'secret_ciphertext',
      type: 'textarea',
      access: { read: () => false },
      admin: { hidden: true, description: 'Nunca se expone en admin ni APIs' },
    },
    {
      name: 'webhook_secret_ciphertext',
      type: 'textarea',
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: 'secret_last4',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'connect_account_id',
      type: 'text',
      admin: { description: 'acct_ opcional para Stripe Connect' },
    },
    {
      name: 'livemode',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  timestamps: true,
}

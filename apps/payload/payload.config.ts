import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

const plans = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]

const tenantStatus = [
  { label: 'Trial', value: 'trial' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3003',
  secret: process.env.PAYLOAD_SECRET || 'development-secret-change-me',
  admin: {
    user: 'users',
  },
  typescript: {
    outputFile: './payload-types.ts',
  },
  plugins: [],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/akademate',
    },
  }),
  collections: [
    {
      slug: 'tenants',
      access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: ({ req }) => Boolean(req?.user?.roles?.includes?.('superadmin')),
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        {
          name: 'plan',
          type: 'select',
          required: true,
          defaultValue: 'starter',
          options: plans,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'trial',
          options: tenantStatus,
        },
        { name: 'mrr', type: 'number', defaultValue: 0 },
        { name: 'domains', type: 'array', labels: { singular: 'Dominio', plural: 'Dominios' }, fields: [{ name: 'host', type: 'text' }] },
        { name: 'branding', type: 'json', defaultValue: {} },
      ],
    },
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      access: {
        read: ({ req }) => Boolean(req?.user),
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'roles', type: 'array', defaultValue: [], fields: [{ name: 'role', type: 'text' }] },
        { name: 'tenantId', type: 'relationship', relationTo: 'tenants', hasMany: true },
      ],
    },
    {
      slug: 'memberships',
      access: { read: ({ req }) => Boolean(req?.user), create: () => true, update: () => true },
      fields: [
        { name: 'user', type: 'relationship', relationTo: 'users', required: true },
        { name: 'tenant', type: 'relationship', relationTo: 'tenants', required: true },
        { name: 'roles', type: 'array', fields: [{ name: 'role', type: 'text' }], defaultValue: [] },
        { name: 'status', type: 'text', defaultValue: 'active' },
      ],
    },
    {
      slug: 'courses',
      access: { read: () => true, create: () => true, update: () => true },
      fields: [
        { name: 'tenant', type: 'relationship', relationTo: 'tenants', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'status', type: 'text', defaultValue: 'draft' },
        { name: 'metadata', type: 'json', defaultValue: {} },
      ],
    },
    {
      slug: 'api-keys',
      access: { read: () => true, create: () => true, update: () => true },
      fields: [
        { name: 'tenant', type: 'relationship', relationTo: 'tenants', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'key', type: 'text', required: true, unique: true },
        { name: 'scopes', type: 'array', fields: [{ name: 'scope', type: 'text' }], defaultValue: [] },
        { name: 'status', type: 'text', defaultValue: 'active' },
        { name: 'lastUsedAt', type: 'date' },
      ],
    },
    {
      slug: 'audit-logs',
      access: { read: ({ req }) => Boolean(req?.user), create: () => true },
      admin: { useAsTitle: 'action' },
      fields: [
        { name: 'tenant', type: 'relationship', relationTo: 'tenants', required: true },
        { name: 'user', type: 'relationship', relationTo: 'users' },
        { name: 'userEmail', type: 'text' },
        { name: 'action', type: 'text', required: true },
        { name: 'resource', type: 'text', required: true },
        { name: 'resourceId', type: 'text', required: true },
        { name: 'oldValue', type: 'json' },
        { name: 'newValue', type: 'json' },
        { name: 'ipAddress', type: 'text' },
        { name: 'userAgent', type: 'text' },
      ],
    },
  ],
})

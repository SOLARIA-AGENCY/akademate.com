import type { CollectionConfig } from 'payload'

/**
 * Tenants Collection - Multi-tenant Support
 *
 * Represents an academy/organization in the system.
 * Only SuperAdmin users can manage tenants via Payload Admin (/admin).
 *
 * Each tenant has:
 * - Unique slug for URL routing
 * - Branding (logo, colors)
 * - Settings and configuration
 * - Active/inactive status
 */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    group: 'Sistema',
    description: 'Academias/Organizaciones del sistema multi-tenant',
    defaultColumns: ['name', 'slug', 'active', 'createdAt'],
  },
  access: {
    // Only SuperAdmin can access tenants via Payload Admin
    read: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'superadmin'
    },
    create: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'superadmin'
    },
    update: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'superadmin'
    },
    delete: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'superadmin'
    },
  },
  fields: [
    // ===== BASIC INFO =====
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre',
      admin: {
        description: 'Nombre de la academia/organización (ej: "CEP Formación")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        description: 'Identificador único para URLs (ej: "cep-formacion")',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (value) {
              // Normalize slug: lowercase, replace spaces with hyphens
              return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'domain',
      type: 'text',
      label: 'Dominio',
      admin: {
        description: 'Dominio personalizado (ej: "cep.example.com") - Opcional',
      },
    },

    // ===== BRANDING =====
    {
      name: 'branding',
      type: 'group',
      label: 'Marca',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
        },
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'media',
          label: 'Favicon',
        },
        {
          name: 'primaryColor',
          type: 'text',
          label: 'Color Primario',
          defaultValue: '#F2014B',
          admin: {
            description: 'Color hexadecimal (ej: "#F2014B")',
          },
        },
        {
          name: 'secondaryColor',
          type: 'text',
          label: 'Color Secundario',
          defaultValue: '#1a1a2e',
        },
      ],
    },

    // ===== CONTACT INFO =====
    {
      name: 'contact',
      type: 'group',
      label: 'Contacto',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email Principal',
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Teléfono',
        },
        {
          name: 'address',
          type: 'textarea',
          label: 'Dirección',
        },
        {
          name: 'website',
          type: 'text',
          label: 'Sitio Web',
        },
      ],
    },

    // ===== SETTINGS =====
    {
      name: 'settings',
      type: 'group',
      label: 'Configuración',
      fields: [
        {
          name: 'timezone',
          type: 'select',
          label: 'Zona Horaria',
          defaultValue: 'Europe/Madrid',
          options: [
            { label: 'Europe/Madrid', value: 'Europe/Madrid' },
            { label: 'Europe/London', value: 'Europe/London' },
            { label: 'America/New_York', value: 'America/New_York' },
            { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
            { label: 'Atlantic/Canary', value: 'Atlantic/Canary' },
          ],
        },
        {
          name: 'language',
          type: 'select',
          label: 'Idioma',
          defaultValue: 'es',
          options: [
            { label: 'Español', value: 'es' },
            { label: 'English', value: 'en' },
            { label: 'Português', value: 'pt' },
          ],
        },
        {
          name: 'features',
          type: 'group',
          label: 'Funcionalidades',
          fields: [
            {
              name: 'enableLeads',
              type: 'checkbox',
              label: 'Habilitar Leads',
              defaultValue: true,
            },
            {
              name: 'enableCampaigns',
              type: 'checkbox',
              label: 'Habilitar Campañas',
              defaultValue: true,
            },
            {
              name: 'enableBlog',
              type: 'checkbox',
              label: 'Habilitar Blog',
              defaultValue: true,
            },
            {
              name: 'enableAnalytics',
              type: 'checkbox',
              label: 'Habilitar Analíticas',
              defaultValue: true,
            },
          ],
        },
      ],
    },

    // ===== INTEGRATIONS =====
    {
      name: 'integrations',
      type: 'group',
      label: 'Integraciones',
      admin: {
        description: 'Configuración de servicios externos',
      },
      fields: [
        {
          name: 'ga4MeasurementId',
          type: 'text',
          label: 'Google Analytics 4 ID',
          admin: {
            description: 'Ej: G-XXXXXXXXXX',
          },
        },
        {
          name: 'metaPixelId',
          type: 'text',
          label: 'Meta Pixel ID',
        },
        {
          name: 'mailchimpApiKey',
          type: 'text',
          label: 'Mailchimp API Key',
          admin: {
            description: 'Para integración de email marketing',
          },
        },
        {
          name: 'whatsappBusinessId',
          type: 'text',
          label: 'WhatsApp Business ID',
        },
      ],
    },

    // ===== STATUS =====
    {
      name: 'active',
      type: 'checkbox',
      label: 'Activo',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Desactivar para suspender acceso al tenant',
      },
    },

    // ===== LIMITS =====
    {
      name: 'limits',
      type: 'group',
      label: 'Límites',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'maxUsers',
          type: 'number',
          label: 'Máx. Usuarios',
          defaultValue: 50,
          min: 1,
        },
        {
          name: 'maxCourses',
          type: 'number',
          label: 'Máx. Cursos',
          defaultValue: 100,
          min: 1,
        },
        {
          name: 'maxLeadsPerMonth',
          type: 'number',
          label: 'Máx. Leads/Mes',
          defaultValue: 1000,
          min: 1,
        },
        {
          name: 'storageQuotaMB',
          type: 'number',
          label: 'Almacenamiento (MB)',
          defaultValue: 5120, // 5GB
          min: 100,
        },
      ],
    },

    // ===== METADATA =====
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notas Internas',
      admin: {
        description: 'Notas visibles solo para SuperAdmin',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        // Log tenant creation/updates
        console.log(`[Tenant] ${operation}: ${doc.name} (${doc.slug})`)
      },
    ],
  },
}

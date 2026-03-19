import type { CollectionConfig } from 'payload'

/**
 * ApiKeys Collection - API Key Management
 *
 * Stores hashed API keys for tenant-level programmatic access.
 * The plaintext key is NEVER stored — only the SHA-256 hex hash.
 *
 * Available scopes:
 *   courses:read, courses:write
 *   students:read, students:write
 *   enrollments:read, enrollments:write
 *   analytics:read
 *   keys:manage
 *   cycles:read, cycles:write
 *   campuses:read, campuses:write
 *   staff:read, staff:write
 *   convocatorias:read, convocatorias:write
 */
export const ApiKeys: CollectionConfig = {
  slug: 'api-keys',
  admin: {
    useAsTitle: 'name',
    group: 'Sistema',
    description: 'API Keys para acceso programático por tenant',
    defaultColumns: ['name', 'tenant', 'is_active', 'rate_limit_per_day', 'last_used_at', 'createdAt'],
  },
  access: {
    // Tenant admins can read their own keys; superadmin can read all
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'superadmin') return true
      // Tenant admins see only their tenant's keys
      return {
        tenant: {
          equals: (req.user as any).tenant,
        },
      }
    },
    create: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'superadmin' || req.user.role === 'admin'
    },
    update: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'superadmin' || req.user.role === 'admin'
    },
    delete: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'superadmin' || req.user.role === 'admin'
    },
  },
  fields: [
    // ===== IDENTIFICATION =====
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre',
      admin: {
        description: 'Nombre descriptivo para identificar esta API key (ej: "Integración Moodle")',
      },
    },
    {
      name: 'key_hash',
      type: 'text',
      required: true,
      unique: true,
      label: 'Hash de la Clave',
      index: true,
      admin: {
        description: 'SHA-256 hex de la API key — nunca almacenar la clave en texto plano',
        readOnly: true,
      },
    },

    // ===== SCOPES =====
    {
      name: 'scopes',
      type: 'array',
      label: 'Permisos (Scopes)',
      required: true,
      minRows: 1,
      admin: {
        description: 'Permisos otorgados a esta API key',
      },
      fields: [
        {
          name: 'scope',
          type: 'select',
          required: true,
          label: 'Scope',
          options: [
            { label: 'Cursos — Lectura', value: 'courses:read' },
            { label: 'Cursos — Escritura', value: 'courses:write' },
            { label: 'Alumnos — Lectura', value: 'students:read' },
            { label: 'Alumnos — Escritura', value: 'students:write' },
            { label: 'Matrículas — Lectura', value: 'enrollments:read' },
            { label: 'Matrículas — Escritura', value: 'enrollments:write' },
            { label: 'Analíticas — Lectura', value: 'analytics:read' },
            { label: 'API Keys — Gestión', value: 'keys:manage' },
            { label: 'Ciclos — Lectura', value: 'cycles:read' },
            { label: 'Ciclos — Escritura', value: 'cycles:write' },
            { label: 'Sedes — Lectura', value: 'campuses:read' },
            { label: 'Sedes — Escritura', value: 'campuses:write' },
            { label: 'Personal — Lectura', value: 'staff:read' },
            { label: 'Personal — Escritura', value: 'staff:write' },
            { label: 'Convocatorias — Lectura', value: 'convocatorias:read' },
            { label: 'Convocatorias — Escritura', value: 'convocatorias:write' },
          ],
        },
      ],
    },

    // ===== TENANT RELATION =====
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      label: 'Tenant',
      admin: {
        description: 'Academia/organización a la que pertenece esta API key',
      },
    },

    // ===== STATUS =====
    {
      name: 'is_active',
      type: 'checkbox',
      label: 'Activa',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Desactivar para revocar la API key sin eliminarla',
      },
    },

    // ===== RATE LIMITING =====
    {
      name: 'rate_limit_per_day',
      type: 'number',
      label: 'Límite de Requests/Día',
      defaultValue: 1000,
      min: 1,
      max: 1000000,
      admin: {
        position: 'sidebar',
        description: 'Número máximo de requests permitidos por día (default: 1000)',
      },
    },

    // ===== USAGE TRACKING =====
    {
      name: 'last_used_at',
      type: 'date',
      label: 'Último Uso',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Fecha/hora del último request autenticado con esta key',
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
      },
    },
  ],
  timestamps: true,
}

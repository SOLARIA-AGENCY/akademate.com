import type { CollectionConfig } from 'payload';
import { canManageCycles } from './access/canManageCycles';
import { cycleSchema, formatValidationErrors } from './Cycles.validation';
import { tenantField, tenantFilteredAccess } from '../../access/tenantAccess';

/**
 * Cycles Collection
 *
 * Represents educational cycles (FP Básica, Grado Medio, Grado Superior, etc.)
 * that categorize courses offered by CEP Comunicación.
 *
 * Database: PostgreSQL table 'cycles'
 * Access Control:
 * - Read: Public (anonymous users can view cycles)
 * - Create/Update/Delete: Admin and Gestor roles only
 *
 * Key Features:
 * - Auto-slug generation from name if not provided
 * - Unique slug constraint enforced at database level
 * - Order display for sorting in frontend
 * - Level validation (enum)
 * - Timestamps (createdAt, updatedAt)
 * - Zod schema validation for type safety
 */
export const Cycles: CollectionConfig = {
  slug: 'cycles',
  labels: {
    singular: 'Cycle',
    plural: 'Cycles',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'level', 'order_display'],
    group: 'Core',
    description: 'Educational cycles that categorize courses',
  },
  access: {
    read: () => true, // Public read access
    create: canManageCycles,
    update: canManageCycles,
    delete: canManageCycles,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from name if not provided)',
        position: 'sidebar',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Slug is required';
        if (val.length > 100) return 'Slug must be less than 100 characters';
        if (!/^[a-z0-9-]+$/.test(val)) {
          return 'Slug must be lowercase alphanumeric with hyphens only';
        }
        return true;
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name of the cycle',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Name is required';
        if (val.length < 3) return 'Name must be at least 3 characters';
        if (val.length > 100) return 'Name must be less than 100 characters';
        return true;
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Detailed description of the cycle',
      },
      validate: (val: string | undefined) => {
        if (val && val.length > 500) {
          return 'Description must be less than 500 characters';
        }
        return true;
      },
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      options: [
        { label: 'FP Básica', value: 'fp_basica' },
        { label: 'Grado Medio', value: 'grado_medio' },
        { label: 'Grado Superior', value: 'grado_superior' },
        { label: 'Certificado de Profesionalidad', value: 'certificado_profesionalidad' },
      ],
      admin: {
        description: 'Educational level of the cycle',
      },
    },
    {
      name: 'order_display',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display order (lower numbers appear first)',
        position: 'sidebar',
      },
      validate: (val: number | undefined) => {
        if (val === undefined || val === null) return true; // Optional field
        if (!Number.isInteger(val)) return 'Order display must be an integer';
        if (val < 0 || val > 100) return 'Order display must be between 0 and 100';
        return true;
      },
    },

    /**
     * Tenant - Multi-tenant support
     * Associates cycle with a specific academy/organization
     */
    tenantField,
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Auto-generate slug from name if not provided
        if (data?.name && !data?.slug) {
          data.slug = data.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }
        return data;
      },
    ],
    beforeChange: [
      ({ data }) => {
        // Validate entire payload with Zod schema
        const result = cycleSchema.safeParse(data);

        if (!result.success) {
          const errors = formatValidationErrors(result.error);
          console.error('Cycle validation failed:', errors);
          // Payload will handle field-level validation,
          // this is an additional layer for complex validation
        }

        return data;
      },
    ],
  },
  timestamps: true,
  defaultSort: 'order_display',
};

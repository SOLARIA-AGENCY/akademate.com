import type { CollectionConfig } from 'payload';
import { canManageCycles } from './access/canManageCycles';
import { cycleSchema, formatValidationErrors } from './Cycles.validation';
import { tenantField } from '../../access/tenantAccess';

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
    defaultColumns: ['name', 'level', 'family', 'active', 'order_display'],
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
        if (val && val.length > 2000) {
          return 'Description must be less than 2000 characters';
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

    // --- Image ---
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Imagen ilustrativa del ciclo' },
    },

    // --- Duration & Modality ---
    {
      name: 'duration',
      type: 'group',
      label: 'Duración y Modalidad',
      fields: [
        { name: 'totalHours', type: 'number', label: 'Horas totales', admin: { description: 'Ej: 2000' } },
        { name: 'courses', type: 'number', label: 'Cursos escolares', admin: { description: 'Ej: 2' } },
        {
          name: 'modality',
          type: 'select',
          label: 'Modalidad',
          options: [
            { label: 'Presencial', value: 'presencial' },
            { label: 'Semipresencial', value: 'semipresencial' },
            { label: 'Online', value: 'online' },
            { label: 'Mixto', value: 'mixto' },
          ],
        },
        { name: 'classFrequency', type: 'text', label: 'Frecuencia de clases', admin: { description: 'Ej: 1 día a la semana' } },
        { name: 'schedule', type: 'text', label: 'Horario', admin: { description: 'Ej: Viernes 9:00-14:00' } },
        { name: 'practiceHours', type: 'number', label: 'Horas prácticas (FCT)', admin: { description: 'Ej: 500' } },
      ],
    },

    // --- Official title & Family ---
    { name: 'officialTitle', type: 'text', label: 'Título oficial', admin: { description: 'Título que se obtiene al completar' } },
    { name: 'family', type: 'text', label: 'Familia profesional', admin: { description: 'Ej: Sanidad, Informática' } },

    // --- Requirements ---
    {
      name: 'requirements',
      type: 'array',
      label: 'Requisitos de acceso',
      fields: [
        { name: 'text', type: 'text', required: true, label: 'Requisito' },
        {
          name: 'type',
          type: 'select',
          label: 'Tipo',
          defaultValue: 'alternativo',
          options: [
            { label: 'Obligatorio', value: 'obligatorio' },
            { label: 'Alternativo', value: 'alternativo' },
          ],
        },
      ],
    },

    // --- Modules ---
    {
      name: 'modules',
      type: 'array',
      label: 'Módulos / Asignaturas',
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Nombre del módulo' },
        {
          name: 'courseYear',
          type: 'select',
          label: 'Curso',
          options: [
            { label: 'Primero', value: '1' },
            { label: 'Segundo', value: '2' },
          ],
        },
        { name: 'hours', type: 'number', label: 'Horas' },
        {
          name: 'type',
          type: 'select',
          label: 'Tipo',
          defaultValue: 'troncal',
          options: [
            { label: 'Troncal', value: 'troncal' },
            { label: 'Optativo', value: 'optativo' },
            { label: 'Transversal', value: 'transversal' },
            { label: 'FCT', value: 'fct' },
          ],
        },
      ],
    },

    // --- Career Paths ---
    {
      name: 'careerPaths',
      type: 'array',
      label: 'Salidas profesionales',
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Puesto / Salida' },
        { name: 'sector', type: 'text', label: 'Sector' },
      ],
    },

    // --- Competencies ---
    {
      name: 'competencies',
      type: 'array',
      label: 'Competencias y enfoque diferenciador',
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Competencia' },
        { name: 'description', type: 'textarea', label: 'Descripción' },
      ],
    },

    // --- Pricing ---
    {
      name: 'pricing',
      type: 'group',
      label: 'Precios',
      fields: [
        { name: 'enrollmentFee', type: 'number', label: 'Matrícula (€)' },
        { name: 'monthlyFee', type: 'number', label: 'Mensualidad (€)' },
        { name: 'totalPrice', type: 'number', label: 'Precio total (€)' },
        {
          name: 'paymentOptions',
          type: 'array',
          label: 'Opciones de pago',
          fields: [
            { name: 'option', type: 'text', required: true },
          ],
        },
        { name: 'priceNotes', type: 'textarea', label: 'Notas sobre precios' },
      ],
    },

    // --- Scholarships ---
    {
      name: 'scholarships',
      type: 'array',
      label: 'Becas y subvenciones',
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Nombre' },
        { name: 'description', type: 'textarea', label: 'Descripción' },
        { name: 'url', type: 'text', label: 'URL información' },
        {
          name: 'type',
          type: 'select',
          label: 'Tipo',
          options: [
            { label: 'Beca', value: 'beca' },
            { label: 'Subvención', value: 'subvencion' },
            { label: 'Financiación', value: 'financiacion' },
          ],
        },
      ],
    },
    { name: 'fundaeEligible', type: 'checkbox', label: 'Bonificable por FUNDAE', defaultValue: false },

    // --- Further Studies ---
    {
      name: 'furtherStudies',
      type: 'array',
      label: 'Continuidad formativa',
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Estudio / Certificación' },
        { name: 'description', type: 'textarea', label: 'Descripción' },
      ],
    },

    // --- Documents ---
    {
      name: 'documents',
      type: 'array',
      label: 'Documentos y catálogo',
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Título del documento' },
        { name: 'file', type: 'upload', relationTo: 'media', required: true, label: 'Archivo' },
        {
          name: 'type',
          type: 'select',
          label: 'Tipo',
          options: [
            { label: 'Catálogo', value: 'catalogo' },
            { label: 'Ficha técnica', value: 'ficha' },
            { label: 'Programa', value: 'programa' },
            { label: 'Otro', value: 'otro' },
          ],
        },
      ],
    },

    // --- Features ---
    {
      name: 'features',
      type: 'array',
      label: 'Características destacadas',
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Característica' },
        { name: 'description', type: 'textarea', label: 'Descripción' },
      ],
    },

    // --- Active status ---
    { name: 'active', type: 'checkbox', label: 'Activo', defaultValue: true, admin: { position: 'sidebar' } },

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

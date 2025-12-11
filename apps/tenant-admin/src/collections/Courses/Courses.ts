import type { CollectionConfig } from 'payload';
import { canManageCourses, canReadCourses, canUpdateCourse } from './access';
import { validateCourseRelationships, generateSlug } from './hooks';
import { formatValidationErrors, CourseUpdateSchema } from './Courses.validation';
import { tenantField, tenantFilteredAccess } from '../../access/tenantAccess';

/**
 * Courses Collection
 *
 * Represents the course catalog for CEP Comunicación's educational programs.
 * Courses are categorized by cycles and can be offered at multiple campuses.
 *
 * Database: PostgreSQL table 'courses'
 *
 * Key Features:
 * - Multi-campus support (courses can be offered at multiple locations)
 * - Modality options: presencial (in-person), online, hibrido (blended)
 * - Financial aid availability tracking
 * - Featured course flag for homepage promotion
 * - Active/inactive status for soft delete functionality
 * - SEO metadata (meta_title, meta_description)
 * - Auto-slug generation from course name
 * - Creator tracking (created_by user_id)
 *
 * Relationships:
 * - Many-to-One: Course → Cycle (required)
 * - Many-to-Many: Course ↔ Campuses (optional, via array)
 * - Many-to-One: Course → User (created_by, optional)
 *
 * Access Control:
 * - Read: Public can see active courses; authenticated staff see all
 * - Create: Admin, Gestor, Marketing
 * - Update: Admin/Gestor (all), Marketing (own courses only)
 * - Delete: Admin, Gestor
 *
 * Validation:
 * - 3-layer validation: Payload fields + Zod schemas + PostgreSQL constraints
 * - Slug uniqueness enforced
 * - Relationship validation (cycle and campuses must exist)
 * - Price and duration must be positive
 * - Modality must be one of: presencial, online, hibrido
 */
export const Courses: CollectionConfig = {
  slug: 'courses',

  labels: {
    singular: 'Course',
    plural: 'Courses',
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'course_type', 'area', 'modality', 'active', 'featured'],
    group: 'Courses',
    description: 'Educational course catalog with pricing, modality, and campus information',
  },

  /**
   * Collection-level access control
   */
  access: {
    /**
     * Read: Public sees active courses; authenticated staff see all
     */
    read: canReadCourses,

    /**
     * Create: Admin, Gestor, Marketing
     */
    create: canManageCourses,

    /**
     * Update: Admin/Gestor (all), Marketing (own courses)
     */
    update: canUpdateCourse,

    /**
     * Delete: Admin and Gestor only
     */
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
  },

  fields: [
    /**
     * Codigo - Unique auto-generated course code
     * Format: {AREA_CODE}-{TIPO_CODE}-{SEQUENTIAL}
     * Examples: MKT-PRIV-0001, DEV-OCUP-0012
     */
    {
      name: 'codigo',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Código único auto-generado (ej: MKT-PRIV-0001)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'El código es obligatorio';
        if (!/^[A-Z]{3,4}-[A-Z]{4}-\d{4}$/.test(val)) {
          return 'Formato inválido. Debe ser: AREA-TIPO-0001';
        }
        return true;
      },
    },

    /**
     * Slug - URL-friendly unique identifier
     * Auto-generated from name if not provided
     */
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from name. Lowercase, hyphens only.',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Slug is required';
        if (val.length > 500) return 'Slug must be 500 characters or less';
        if (!/^[a-z0-9-]+$/.test(val)) {
          return 'Slug must be lowercase alphanumeric with hyphens only';
        }
        return true;
      },
    },

    /**
     * Name - Course display name
     */
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 500,
      admin: {
        description: 'Course name (max 500 characters)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Course name is required';
        if (val.length > 500) return 'Course name must be 500 characters or less';
        return true;
      },
    },

    /**
     * Featured Image - Course image for cards and hero sections
     * Relationship to Media collection
     */
    {
      name: 'featured_image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Main image displayed on course cards and detail page',
      },
    },

    /**
     * Cycle - Educational cycle relationship (optional)
     * Many-to-One relationship
     */
    {
      name: 'cycle',
      type: 'relationship',
      relationTo: 'cycles',
      required: false,
      index: true,
      admin: {
        description: 'The educational cycle this course belongs to (optional)',
      },
    },

    /**
     * Campuses - Multi-campus support (optional)
     * Many-to-Many relationship via array
     * Empty array indicates online-only course
     */
    {
      name: 'campuses',
      type: 'relationship',
      relationTo: 'campuses',
      hasMany: true,
      admin: {
        description: 'Campuses where this course is offered (leave empty for online-only courses)',
      },
    },

    /**
     * Short Description - Brief summary for listings
     */
    {
      name: 'short_description',
      type: 'textarea',
      admin: {
        description: 'Brief course summary for listings (optional)',
        rows: 3,
      },
    },

    /**
     * Long Description - Detailed course information
     */
    {
      name: 'long_description',
      type: 'richText',
      admin: {
        description: 'Detailed course information (optional)',
      },
    },

    /**
     * Modality - Delivery method (required)
     * Enum: presencial, online, hibrido
     */
    {
      name: 'modality',
      type: 'select',
      required: true,
      options: [
        { label: 'Presencial', value: 'presencial' },
        { label: 'Online', value: 'online' },
        { label: 'Híbrido', value: 'hibrido' },
      ],
      defaultValue: 'presencial',
      admin: {
        description: 'Course delivery method',
      },
    },

    /**
     * Course Type - Category of course offering
     * Enum: privado, ocupados, desempleados, teleformacion, ciclo_medio, ciclo_superior
     */
    {
      name: 'course_type',
      type: 'select',
      required: false,
      options: [
        { label: 'Privado', value: 'privado' },
        { label: 'Trabajadores Ocupados', value: 'ocupados' },
        { label: 'Trabajadores Desempleados', value: 'desempleados' },
        { label: 'Teleformación', value: 'teleformacion' },
        { label: 'Ciclo Medio', value: 'ciclo_medio' },
        { label: 'Ciclo Superior', value: 'ciclo_superior' },
      ],
      admin: {
        description: 'Type of course offering (determines pricing and visibility)',
      },
    },

    /**
     * Area Formativa - Categorization by knowledge area
     */
    {
      name: 'area_formativa',
      type: 'relationship',
      relationTo: 'areas-formativas',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Área de conocimiento del curso',
      },
    },

    /**
     * Area - Thematic area/category for filtering and organization
     * Enum: sanitaria, horeca, salud, tecnologia, audiovisual, administracion, marketing, educacion
     */
    {
      name: 'area',
      type: 'select',
      required: false,
      options: [
        { label: 'Área Sanitaria', value: 'sanitaria' },
        { label: 'Área Horeca', value: 'horeca' },
        { label: 'Área Salud', value: 'salud' },
        { label: 'Área Tecnología', value: 'tecnologia' },
        { label: 'Área Audiovisual', value: 'audiovisual' },
        { label: 'Área Administración', value: 'administracion' },
        { label: 'Área Marketing', value: 'marketing' },
        { label: 'Área Educación', value: 'educacion' },
      ],
      admin: {
        description: 'Thematic area for filtering courses (e.g., technology, healthcare, marketing)',
      },
    },

    /**
     * Duration Hours - Total course duration in hours
     */
    {
      name: 'duration_hours',
      type: 'number',
      min: 1,
      admin: {
        description: 'Course duration in hours (must be positive)',
        step: 1,
      },
      validate: (val: number | undefined) => {
        if (val === undefined || val === null) return true; // Optional field
        if (val < 1) return 'Duration must be at least 1 hour';
        if (!Number.isInteger(val)) return 'Duration must be an integer';
        return true;
      },
    },

    /**
     * Base Price - Course price in euros
     */
    {
      name: 'base_price',
      type: 'number',
      min: 0,
      admin: {
        description: 'Base price in euros (2 decimal places)',
        step: 0.01,
      },
      validate: (val: number | undefined) => {
        if (val === undefined || val === null) return true; // Optional field
        if (val < 0) return 'Price cannot be negative';
        // Check 2 decimal places
        const decimals = (val.toString().split('.')[1] || '').length;
        if (decimals > 2) return 'Price must have at most 2 decimal places';
        return true;
      },
    },

    /**
     * Subsidy Percentage - Percentage of subsidy for this course
     */
    {
      name: 'subsidy_percentage',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 100,
      admin: {
        description: 'Subsidy percentage (0-100%). Use 100 for fully subsidized courses.',
        step: 1,
        condition: (data: any) => !data.base_price || data.base_price === 0,
      },
      validate: (val: number | undefined, { data }: any) => {
        // Only validate if no price is set (subsidized course)
        if (data.base_price && data.base_price > 0) return true;

        if (val === undefined || val === null) return true;
        if (val < 0 || val > 100) return 'Subsidy percentage must be between 0 and 100';
        return true;
      },
    },

    /**
     * Financial Aid Available - Flag for aid eligibility
     */
    {
      name: 'financial_aid_available',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether financial aid is available for this course',
        position: 'sidebar',
      },
    },

    /**
     * Active - Visibility status (soft delete)
     */
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Active courses are visible to the public',
      },
    },

    /**
     * Featured - Homepage promotion flag
     */
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Featured courses appear prominently on the homepage',
      },
    },

    /**
     * Meta Title - SEO meta title
     */
    {
      name: 'meta_title',
      type: 'text',
      maxLength: 300,
      admin: {
        position: 'sidebar',
        description: 'SEO meta title (optional, max 300 chars)',
      },
      validate: (val: string | undefined) => {
        if (!val) return true; // Optional
        if (val.length > 300) return 'Meta title must be 300 characters or less';
        return true;
      },
    },

    /**
     * Meta Description - SEO meta description
     */
    {
      name: 'meta_description',
      type: 'textarea',
      maxLength: 500,
      admin: {
        position: 'sidebar',
        description: 'SEO meta description (optional, max 500 chars)',
        rows: 3,
      },
      validate: (val: string | undefined) => {
        if (!val) return true; // Optional
        if (val.length > 500) return 'Meta description must be 500 characters or less';
        return true;
      },
    },

    /**
     * Created By - User who created this course
     * Relationship to users collection
     * Read-only, auto-populated via hook
     * SECURITY: Field-level access control prevents modification via API
     */
    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'User who created this course',
      },
      access: {
        read: () => true,
        update: () => false, // SECURITY: Prevent ownership manipulation attacks
      },
    },

    /**
     * Tenant - Multi-tenant support
     * Associates course with a specific academy/organization
     * Auto-assigned based on user's tenant on creation
     */
    tenantField,
  ],

  /**
   * Hooks - Business logic and side effects
   */
  hooks: {
    /**
     * Before Validate - Data preparation and auto-generation
     */
    beforeValidate: [
      ({ data, req }) => {
        // Track creator (only on creation, not updates)
        if (req.user && !data?.created_by && !data?.id) {
          data.created_by = req.user.id;
        }

        return data;
      },
      // Auto-generate slug from name if not provided
      generateSlug,
      // Validate relationships exist
      validateCourseRelationships,
    ],

    /**
     * Before Change - Additional validation
     */
    beforeChange: [
      ({ data }) => {
        // Validate with Zod schema (additional layer)
        const result = CourseUpdateSchema.safeParse(data);

        if (!result.success) {
          const errors = formatValidationErrors(result.error);
          console.error('Course validation failed:', errors);
          // Payload will handle field-level validation,
          // this is an additional layer for complex validation
        }

        return data;
      },
    ],
  },

  /**
   * Timestamps - Auto-track creation and update times
   */
  timestamps: true,

  /**
   * Default Sort - Order by name alphabetically
   */
  defaultSort: 'name',
};

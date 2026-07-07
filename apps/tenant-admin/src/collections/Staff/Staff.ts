import type { CollectionBeforeValidateHook, CollectionConfig, FieldAccess } from 'payload'
import { canEditStaff, canManageStaff } from './access'
import { trackStaffCreator, validateTeachingAreas } from './hooks'
import { normalizeNominativeText } from '@/lib/nominative-text'
import { normalizeSpanishPhone, SPANISH_PHONE_ERROR } from '@/lib/phone'
import {
  normalizeStaffEmail,
  normalizeStaffNif,
  validateStaffEmail,
  validateStaffNif,
} from '@/lib/staff-contact'

/**
 * Type definitions for Staff collection
 */
type UserRole = 'superadmin' | 'admin' | 'gestor' | 'marketing' | 'asesor' | 'lectura'

/** User with role for access control */
interface UserWithRole {
  id: string | number
  role: UserRole
}

/** Type guard to check if user has a valid role */
function hasRole(user: unknown): user is UserWithRole {
  return (
    typeof user === 'object' &&
    user !== null &&
    'role' in user &&
    typeof (user as UserWithRole).role === 'string'
  )
}

/** Staff type options */
type StaffType = 'profesor' | 'administrativo' | 'jefatura_administracion' | 'academico'

/** Data structure for admin condition functions */
interface StaffData {
  staff_type?: StaffType
  first_name?: string
  first_surname?: string
  second_surname?: string
  last_name?: string
  full_name?: string
  nif?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  bio?: string
  photo?: string | number
  position?: string
  contract_type?: string
  employment_status?: string
  inactive_reason?: string
  inactive_at?: string
  reactivated_at?: string
  last_import_batch?: string
  import_review_status?: string
  hire_date?: string
  specialties?: string[]
  qualified_areas?: (string | number)[]
  alias_names?: string
  detected_courses?: string
  certifications?: {
    title?: string
    institution?: string
    year?: number
    document?: string | number
  }[]
  base_campus?: string | number
  assigned_campuses?: (string | number)[]
  is_active?: boolean
  notes?: string
  created_by?: string | number
  id?: string | number
}

function splitSurnameParts(lastName: string | undefined): {
  firstSurname?: string
  secondSurname?: string
} {
  const normalized = normalizeNominativeText(lastName)
  if (!normalized) return {}

  const [firstSurname, ...rest] = normalized.split(' ')
  return {
    firstSurname,
    secondSurname: rest.join(' ') || undefined,
  }
}

function combineSurnameParts(firstSurname?: string, secondSurname?: string): string | undefined {
  return [firstSurname, secondSurname].filter(Boolean).join(' ').trim() || undefined
}

/** Field-level access for notes (only Gestor/Admin) */
const notesReadAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) return false
  return hasRole(user) && (user.role === 'admin' || user.role === 'gestor')
}

const normalizeStaffNominativeFields: CollectionBeforeValidateHook = ({ data }) => {
  const staffData = data as StaffData | undefined
  if (!staffData) return data

  staffData.first_name = normalizeNominativeText(staffData.first_name) ?? staffData.first_name
  staffData.first_surname =
    normalizeNominativeText(staffData.first_surname) ?? staffData.first_surname
  staffData.second_surname =
    normalizeNominativeText(staffData.second_surname) ?? staffData.second_surname

  if (staffData.first_surname !== undefined || staffData.second_surname !== undefined) {
    const derivedLastName = combineSurnameParts(staffData.first_surname, staffData.second_surname)
    if (derivedLastName) staffData.last_name = derivedLastName
  } else if (staffData.last_name !== undefined) {
    const normalizedLastName = normalizeNominativeText(staffData.last_name) ?? staffData.last_name
    const split = splitSurnameParts(normalizedLastName)
    staffData.first_surname = split.firstSurname
    staffData.second_surname = split.secondSurname
    staffData.last_name = normalizedLastName
  }

  staffData.address =
    typeof staffData.address === 'string' ? staffData.address.trim() || undefined : staffData.address
  staffData.city = normalizeNominativeText(staffData.city) ?? staffData.city
  staffData.postal_code =
    typeof staffData.postal_code === 'string'
      ? staffData.postal_code.trim() || undefined
      : staffData.postal_code
  staffData.position = normalizeNominativeText(staffData.position) ?? staffData.position

  if (staffData.first_name && staffData.last_name) {
    staffData.full_name = `${staffData.first_name} ${staffData.last_name}`.trim()
  } else {
    staffData.full_name = normalizeNominativeText(staffData.full_name) ?? staffData.full_name
  }

  if (Array.isArray(staffData.certifications)) {
    staffData.certifications = staffData.certifications.map((certification) => ({
      ...certification,
      title: normalizeNominativeText(certification.title) ?? certification.title,
      institution: normalizeNominativeText(certification.institution) ?? certification.institution,
    }))
  }

  return staffData
}

/**
 * Staff Collection - Personal Management (Profesores y Administrativos)
 *
 * Manages all personnel (professors and administrative staff) across all campuses.
 * This collection supports two types of staff members:
 * - Profesores: Teaching staff assigned to course runs
 * - Administrativos: Administrative staff assigned to campuses
 *
 * Database: PostgreSQL table 'staff'
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: Active professors only (name, bio, specialties) ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: YES ✅
 * - READ: All staff (basic info only) ✅
 * - UPDATE: YES ✅
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: YES ✅
 * - READ: All staff ✅
 * - UPDATE: YES ✅
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅
 * - READ: All staff ✅
 * - UPDATE: YES ✅
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All staff ✅
 * - UPDATE: YES ✅
 * - DELETE: YES ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All staff ✅
 * - UPDATE: YES ✅
 * - DELETE: YES ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Staff Types:
 * - Profesor: Teaching staff (assigned to course runs)
 * - Administrativo: Administrative staff (assigned to campuses)
 *
 * Personal Information:
 * - Full name, email, phone
 * - Biography/description
 * - Photo (media upload)
 * - Active/inactive status
 *
 * Specialties (Professors only):
 * - Multiple specialties (e.g., "Marketing Digital", "Diseño Gráfico")
 * - Used for filtering and assignment
 *
 * Campus Assignment:
 * - Each staff member assigned to a primary campus
 * - Professors can teach at multiple campuses (via course runs)
 * - Administrativos work at their assigned campus
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS
 * ============================================================================
 *
 * Immutable Fields (SP-001: Defense in Depth):
 * - created_by: Auto-populated on create, immutable after creation
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Hook enforces immutability
 *
 * PII Protection:
 * - Email and phone not exposed in public API
 * - Personal data only visible to authenticated users with proper permissions
 * - No PII in application logs
 *
 * Data Integrity:
 * - Email validation (unique per staff member)
 * - Phone validation (Spanish format)
 * - Campus relationship validation
 * - Active status controls visibility
 */
export const Staff: CollectionConfig = {
  slug: 'staff',

  labels: {
    singular: 'Staff Member',
    plural: 'Staff',
  },

  admin: {
    useAsTitle: 'full_name',
    defaultColumns: ['full_name', 'staff_type', 'campus', 'email', 'is_active'],
    group: 'Personal',
    description: 'Professors and administrative staff across all campuses',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canEditStaff, // All authenticated users
    read: ({ req: { user } }) => {
      // Public: Only active professors (basic info)
      if (!user) {
        return {
          staff_type: { equals: 'profesor' },
          is_active: { equals: true },
        }
      }

      // All authenticated users: read all staff
      return true
    },
    update: canEditStaff, // All authenticated users
    delete: canManageStaff, // Gestor, Admin
  },

  fields: [
    // ============================================================================
    // BASIC INFORMATION
    // ============================================================================

    {
      name: 'staff_type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Profesor', value: 'profesor' },
        { label: 'Administrativo', value: 'administrativo' },
        { label: 'Jefatura de Administración', value: 'jefatura_administracion' },
        { label: 'Académico', value: 'academico' },
      ],
      defaultValue: 'profesor',
      admin: {
        position: 'sidebar',
        description: 'Type of staff member (profesor or administrativo)',
      },
    },

    {
      name: 'first_name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'First name',
      },
      validate: (val: unknown): true | string => {
        if (!val) return 'First name is required'
        if (typeof val !== 'string') return 'First name must be a string'
        if (val.trim().length < 2) return 'First name must be at least 2 characters'
        return true
      },
    },

    {
      name: 'last_name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Apellidos derivados de primer apellido + segundo apellido',
      },
      validate: (val: unknown): true | string => {
        if (!val) return 'Last name is required'
        if (typeof val !== 'string') return 'Last name must be a string'
        if (val.trim().length < 2) return 'Last name must be at least 2 characters'
        return true
      },
    },

    {
      name: 'first_surname',
      type: 'text',
      required: false,
      maxLength: 100,
      admin: {
        description: 'Primer apellido',
      },
    },

    {
      name: 'second_surname',
      type: 'text',
      required: false,
      maxLength: 100,
      admin: {
        description: 'Segundo apellido',
      },
    },

    {
      name: 'full_name',
      type: 'text',
      required: false,
      maxLength: 255,
      index: true,
      admin: {
        description: 'Full name (auto-generated from first_name + last_name)',
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ data, value }): string | undefined => {
            // Auto-generate full_name from first_name and last_name
            const staffData = data as StaffData | undefined
            if (staffData?.first_name && staffData?.last_name) {
              const firstName = normalizeNominativeText(staffData.first_name) ?? staffData.first_name
              const lastName = normalizeNominativeText(staffData.last_name) ?? staffData.last_name
              return `${firstName} ${lastName}`.trim()
            }
            return normalizeNominativeText(value) ?? (typeof value === 'string' ? value : undefined)
          },
        ],
      },
    },

    {
      name: 'email',
      type: 'text',
      required: false,
      unique: true,
      index: true,
      admin: {
        description: 'Email address (must be unique)',
      },
      validate: (val: unknown): true | string => {
        const validation = validateStaffEmail(val)
        return validation.valid === false ? validation.error : true
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            const normalized = normalizeStaffEmail(value)
            return normalized ?? undefined
          },
        ],
      },
      // PII Protection: Hide from public API
      access: {
        read: ({ req: { user } }) => !!user, // Only authenticated users
      },
    },

    {
      name: 'nif',
      type: 'text',
      required: false,
      unique: true,
      index: true,
      maxLength: 20,
      admin: {
        description: 'DNI/NIF/NIE interno del docente o personal. No se muestra en la web pública.',
        placeholder: '12345678Z',
      },
      validate: (val: unknown): true | string => {
        const validation = validateStaffNif(val)
        return validation.valid === false ? validation.error : true
      },
      hooks: {
        beforeChange: [
          ({ value }): string | undefined => {
            return normalizeStaffNif(value) ?? undefined
          },
        ],
      },
      access: {
        read: ({ req: { user } }) => !!user && hasRole(user) && user.role !== 'lectura',
      },
    },

    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Phone number (Spanish fixed or mobile)',
        placeholder: '+34 912 345 678',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (typeof value !== 'string' || value.trim() === '') return value
            return normalizeSpanishPhone(value) ?? value
          },
        ],
      },
      validate: (val: unknown): true | string => {
        if (!val) return true // Optional
        if (typeof val !== 'string') return 'Phone must be a string'
        if (!normalizeSpanishPhone(val)) return SPANISH_PHONE_ERROR
        return true
      },
      // PII Protection: Hide from public API
      access: {
        read: ({ req: { user } }) => !!user, // Only authenticated users
      },
    },

    {
      name: 'address',
      type: 'text',
      required: false,
      maxLength: 255,
      admin: {
        description: 'Dirección postal interna',
        placeholder: 'Calle, número, piso',
      },
      access: {
        read: ({ req: { user } }) => !!user,
      },
    },

    {
      name: 'city',
      type: 'text',
      required: false,
      maxLength: 120,
      admin: {
        description: 'Ciudad o municipio',
        placeholder: 'Santa Cruz de Tenerife',
      },
      access: {
        read: ({ req: { user } }) => !!user,
      },
    },

    {
      name: 'postal_code',
      type: 'text',
      required: false,
      maxLength: 12,
      admin: {
        description: 'Código postal',
        placeholder: '38005',
      },
      access: {
        read: ({ req: { user } }) => !!user,
      },
    },

    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short biography or description',
        rows: 3,
      },
    },

    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile photo',
      },
    },

    // ============================================================================
    // EMPLOYMENT INFORMATION (DATOS LABORALES)
    // ============================================================================

    {
      name: 'position',
      type: 'text',
      required: true,
      maxLength: 255,
      admin: {
        description:
          'Job position/title (e.g., "Profesor de Marketing Digital", "Coordinador Académico")',
        placeholder: 'e.g., Profesor de Marketing Digital',
      },
      validate: (val: unknown): true | string => {
        if (!val) return 'Position is required'
        if (typeof val !== 'string') return 'Position must be a string'
        if (val.trim().length < 3) return 'Position must be at least 3 characters'
        return true
      },
    },

    {
      name: 'contract_type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Régimen General', value: 'general_regime' },
        { label: 'Tiempo Completo', value: 'full_time' },
        { label: 'Medio Tiempo', value: 'part_time' },
        { label: 'Freelance / Por Horas', value: 'freelance' },
      ],
      defaultValue: 'full_time',
      admin: {
        description: 'Type of employment contract',
      },
    },

    {
      name: 'employment_status',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Baja Temporal', value: 'temporary_leave' },
        { label: 'Inactivo', value: 'inactive' },
      ],
      defaultValue: 'active',
      admin: {
        position: 'sidebar',
        description: 'Current employment status',
      },
    },

    {
      name: 'inactive_reason',
      type: 'textarea',
      admin: {
        description: 'Motivo interno de baja, inactividad o retirada del docente.',
        rows: 2,
        condition: (data: StaffData) => data.employment_status !== 'active',
      },
    },

    {
      name: 'inactive_at',
      type: 'date',
      admin: {
        description: 'Fecha efectiva de baja o inactividad.',
        date: { pickerAppearance: 'dayOnly' },
        condition: (data: StaffData) => data.employment_status !== 'active',
      },
    },

    {
      name: 'reactivated_at',
      type: 'date',
      admin: {
        description: 'Fecha de última reactivación.',
        date: { pickerAppearance: 'dayOnly' },
        condition: (data: StaffData) => data.employment_status === 'active',
      },
    },

    {
      name: 'hire_date',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description: 'Date of hire / Start date',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
      validate: (val: unknown): true | string => {
        if (!val) return true
        if (typeof val !== 'string' && !(val instanceof Date))
          return 'Hire date must be a valid date'
        const hireDate = new Date(val)
        const today = new Date()
        if (hireDate > today) {
          return 'Hire date cannot be in the future'
        }
        return true
      },
    },

    // ============================================================================
    // PROFESSOR-SPECIFIC FIELDS
    // ============================================================================

    {
      name: 'specialties',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Marketing Digital', value: 'marketing-digital' },
        { label: 'Desarrollo Web', value: 'desarrollo-web' },
        { label: 'Diseño Gráfico', value: 'diseno-grafico' },
        { label: 'Audiovisual', value: 'audiovisual' },
        { label: 'Gestión Empresarial', value: 'gestion-empresarial' },
        { label: 'Redes Sociales', value: 'redes-sociales' },
        { label: 'SEO/SEM', value: 'seo-sem' },
        { label: 'E-commerce', value: 'ecommerce' },
        { label: 'Fotografía', value: 'fotografia' },
        { label: 'Video', value: 'video' },
        { label: 'Quiromasaje', value: 'quiromasaje' },
        { label: 'Entrenamiento personal', value: 'entrenamiento-personal' },
        { label: 'Auxiliar clínico veterinario', value: 'auxiliar-clinico-veterinario' },
        { label: 'Ayudante técnico veterinario', value: 'ayudante-tecnico-veterinario' },
        { label: 'Agente funerario', value: 'agente-funerario' },
        { label: 'Auxiliar de enfermería', value: 'auxiliar-enfermeria' },
        { label: 'Auxiliar de farmacia', value: 'auxiliar-farmacia' },
        { label: 'Parafarmacia', value: 'parafarmacia' },
        { label: 'Dermocosmética', value: 'dermocosmetica' },
        { label: 'Clínicas estéticas', value: 'clinicas-esteticas' },
        { label: 'Nutricosmética', value: 'nutricosmetica' },
        { label: 'Auxiliar de odontología', value: 'auxiliar-odontologia' },
        { label: 'Peluquería canina y felina', value: 'peluqueria-canina-felina' },
        { label: 'Adiestramiento canino', value: 'adiestramiento-canino' },
        { label: 'Pilates', value: 'pilates' },
        {
          label: 'Urgencias Laboratorio y Rehabilitación',
          value: 'urgencias-laboratorio-rehabilitacion',
        },
        { label: 'SPD', value: 'spd' },
      ],
      admin: {
        description: 'Specialties (for professors only)',
        condition: (data: StaffData) => data.staff_type === 'profesor',
      },
    },

    {
      name: 'qualified_areas',
      type: 'relationship',
      relationTo: 'areas-formativas',
      hasMany: true,
      required: false,
      index: true,
      admin: {
        description:
          'Áreas formativas para las que el docente está habilitado. Si está vacío, requiere validación manual antes de asignar.',
        condition: (data: StaffData) =>
          data.staff_type === 'profesor' || data.staff_type === 'academico',
      },
      filterOptions: () => ({
        activo: { equals: true },
      }),
    },

    {
      name: 'certifications',
      type: 'array',
      admin: {
        description: 'Certifications and academic titles (for professors only)',
        condition: (data: StaffData) => data.staff_type === 'profesor',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          maxLength: 255,
          admin: {
            description: 'Certification or degree title',
            placeholder: 'e.g., Máster en Marketing Digital',
          },
        },
        {
          name: 'institution',
          type: 'text',
          required: true,
          maxLength: 255,
          admin: {
            description: 'Issuing institution',
            placeholder: 'e.g., Universidad Complutense de Madrid',
          },
        },
        {
          name: 'year',
          type: 'number',
          required: true,
          admin: {
            description: 'Year obtained',
            placeholder: '2020',
          },
          validate: (val: unknown): true | string => {
            if (!val) return 'Year is required'
            if (typeof val !== 'number') return 'Year must be a number'
            const currentYear = new Date().getFullYear()
            if (val < 1950 || val > currentYear) {
              return `Year must be between 1950 and ${currentYear}`
            }
            return true
          },
        },
        {
          name: 'document',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Certificate PDF or image (optional)',
          },
        },
      ],
    },

    // ============================================================================
    // CAMPUS ASSIGNMENT
    // ============================================================================

    {
      name: 'assigned_campuses',
      type: 'relationship',
      relationTo: 'campuses',
      hasMany: true,
      required: false,
      index: true,
      admin: {
        description: 'Campuses where this staff member can work (select at least one)',
      },
      validate: (): true | string => {
        return true
      },
    },
    {
      name: 'base_campus',
      type: 'relationship',
      relationTo: 'campuses',
      required: false,
      index: true,
      admin: {
        description:
          'Sede base administrativa principal. No limita las sedes operativas asignadas.',
      },
    },
    {
      name: 'data_quality_status',
      type: 'select',
      required: true,
      defaultValue: 'complete',
      index: true,
      options: [
        { label: 'Completo', value: 'complete' },
        { label: 'Pendiente de validación', value: 'pending_validation' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Estado de calidad del dato operativo',
      },
    },
    {
      name: 'import_review_status',
      type: 'select',
      required: true,
      defaultValue: 'validated',
      index: true,
      options: [
        { label: 'Validado', value: 'validated' },
        { label: 'Pendiente de revisión', value: 'pending_review' },
        { label: 'Ambiguo', value: 'ambiguous' },
        { label: 'Candidato a baja', value: 'retired_candidate' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Estado de revisión del registro tras importaciones o auditorías.',
      },
    },
    {
      name: 'last_import_batch',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Identificador del último lote de importación que tocó este registro.',
      },
    },
    {
      name: 'source',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Fuente de importación o mantenimiento del registro',
      },
    },
    {
      name: 'alias_names',
      type: 'textarea',
      admin: {
        description:
          'Alias o nombres abreviados detectados en cursos/convocatorias. Un alias siempre debe apuntar a una ficha staff maestra.',
        rows: 2,
      },
    },
    {
      name: 'detected_courses',
      type: 'textarea',
      admin: {
        description: 'Cursos donde se detectó este docente durante la consolidación CEP.',
        rows: 2,
      },
    },

    // ============================================================================
    // STATUS
    // ============================================================================

    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Is this staff member currently active?',
      },
    },

    // ============================================================================
    // INTERNAL NOTES
    // ============================================================================

    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes (not visible to public)',
        rows: 2,
      },
      access: {
        read: notesReadAccess, // Only Gestor/Admin
      },
    },

    // ============================================================================
    // AUDIT TRAIL
    // ============================================================================

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'User who created this staff member (auto-populated)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
      },
      // SECURITY Layer 2 (Security): Field-level access control prevents API manipulation
      access: {
        read: () => true,
        update: () => false, // Immutable after creation
      },
    },
  ],

  /**
   * Hooks - Business logic and validation
   */
  hooks: {
    beforeValidate: [normalizeStaffNominativeFields, validateTeachingAreas],
    /**
     * Before Change: Run after validation, before database write
     */
    beforeChange: [
      trackStaffCreator, // Auto-populate and protect created_by field
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
}

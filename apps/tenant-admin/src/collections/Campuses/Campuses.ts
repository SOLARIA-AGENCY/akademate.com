import type { CollectionConfig, FieldHook } from 'payload';
import { canManageCampuses } from './access/canManageCampuses';
import { campusSchema, formatValidationErrors } from './Campuses.validation';
import { tenantField } from '../../access/tenantAccess';
import { ensurePrimaryInServiceLocations } from '../../domain/campus-operating-model';
import { ensureDefaultClassroom } from './hooks/ensureDefaultClassroom'

interface CampusData {
  id?: number;
  slug?: string;
  name?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  maps_url?: string;
  staff_members?: (number | { id: number })[];
  legal_entity?: number | { id: number };
  primary_location?: number | { id: number };
  service_locations?: (number | { id: number })[];
  tenant?: number;
}

function relationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
    if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id)
  }
  return null
}

const trimFieldHook: FieldHook = ({ value }) => {
  return typeof value === 'string' ? value.trim() : value;
};

export const Campuses: CollectionConfig = {
  slug: 'campuses',
  labels: {
    singular: 'Campus',
    plural: 'Campuses',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'phone', 'email', 'active'],
    group: 'Core',
    description: 'Sedes fisicas donde se imparten cursos y ciclos',
  },
  access: {
    read: () => true,
    create: canManageCampuses,
    update: canManageCampuses,
    delete: canManageCampuses,
  },
  fields: [
    // ====================================================================
    // IDENTIFICATION
    // ====================================================================
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from name)',
        position: 'sidebar',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Slug is required';
        if (val.length > 100) return 'Slug must be less than 100 characters';
        if (!/^[a-z0-9-]+$/.test(val)) return 'Slug must be lowercase alphanumeric with hyphens only';
        return true;
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Nombre de la sede (ej: "Sede Santa Cruz")' },
      validate: (val: string | undefined) => {
        if (!val) return 'Name is required';
        const t = val.trim();
        if (t.length < 3) return 'Name must be at least 3 characters';
        if (t.length > 100) return 'Name must be less than 100 characters';
        return true;
      },
      hooks: { beforeChange: [trimFieldHook] },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Descripcion de la sede, instalaciones y entorno', rows: 4 },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Sede operativa', position: 'sidebar' },
    },
    {
      name: 'code',
      type: 'text',
      index: true,
      admin: { description: 'Código lógico del campus', position: 'sidebar' },
    },
    {
      name: 'display_name',
      type: 'text',
      admin: { description: 'Nombre público extendido' },
    },
    {
      name: 'campus_type',
      type: 'select',
      defaultValue: 'TRAINING_CENTER',
      options: [
        { label: 'Centro de formación', value: 'TRAINING_CENTER' },
        { label: 'Proveedor formativo', value: 'TRAINING_PROVIDER' },
        { label: 'Centro asociativo', value: 'ASSOCIATION_TRAINING_CENTER' },
      ],
    },
    { name: 'brand', type: 'text', admin: { description: 'Marca visible' } },
    {
      name: 'campus_kind',
      type: 'select',
      defaultValue: 'physical',
      options: [
        { label: 'Física', value: 'physical' },
        { label: 'Virtual', value: 'virtual' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'legal_entity',
      type: 'relationship',
      relationTo: 'legal-entities',
      index: true,
      admin: {
        description: 'Persona jurídica. Los asientos se agrupan aquí, no por ubicación.',
      },
    },
    {
      name: 'primary_location',
      type: 'relationship',
      relationTo: 'locations',
      index: true,
      admin: { description: 'Ubicación física principal' },
    },
    {
      name: 'service_locations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      admin: {
        description: 'Ubicaciones donde opera. Debe incluir la principal.',
      },
    },
    {
      name: 'verification_status',
      type: 'select',
      defaultValue: 'VERIFIED',
      options: [
        { label: 'Verificado', value: 'VERIFIED' },
        { label: 'Asunción interna', value: 'INTERNAL_ASSUMPTION' },
      ],
    },
    { name: 'accounting_email', type: 'email' },
    { name: 'training_email', type: 'email' },
    { name: 'visible_publicly', type: 'checkbox', defaultValue: true },

    // ====================================================================
    // IMAGES
    // ====================================================================
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Foto principal de la sede' },
    },
    {
      name: 'photos',
      type: 'array',
      label: 'Galeria de Fotos',
      admin: { description: 'Fotos adicionales de la sede, aulas, instalaciones' },
      fields: [
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          admin: { placeholder: 'Descripcion de la foto' },
        },
      ],
    },

    // ====================================================================
    // LOCATION & CONTACT
    // ====================================================================
    {
      name: 'city',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Ciudad' },
      validate: (val: string | undefined) => {
        if (!val) return 'City is required';
        const t = val.trim();
        if (t.length < 2) return 'City must be at least 2 characters';
        if (t.length > 50) return 'City must be less than 50 characters';
        return true;
      },
      hooks: { beforeChange: [trimFieldHook] },
    },
    {
      name: 'province',
      type: 'text',
      admin: { description: 'Provincia', placeholder: 'Santa Cruz de Tenerife' },
    },
    {
      name: 'address',
      type: 'textarea',
      admin: { description: 'Direccion completa', rows: 2 },
      validate: (val: string | undefined) => {
        if (val && val.length > 200) return 'Address must be less than 200 characters';
        return true;
      },
    },
    {
      name: 'postal_code',
      type: 'text',
      admin: { description: 'Codigo postal (5 digitos)', placeholder: '38005' },
      validate: (val: string | undefined) => {
        if (!val) return true;
        if (!/^\d{5}$/.test(val)) return 'Postal code must be exactly 5 digits';
        return true;
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'Telefono principal', placeholder: '922 219 257' },
    },
    {
      name: 'phone2',
      type: 'text',
      admin: { description: 'Telefono secundario / movil', placeholder: '618 989 648' },
    },
    {
      name: 'email',
      type: 'email',
      admin: { description: 'Email de contacto', placeholder: 'sede@academia.es' },
    },
    {
      name: 'web',
      type: 'text',
      admin: { description: 'Sitio web de la sede', placeholder: 'https://...' },
      validate: (val: string | undefined) => {
        if (!val) return true;
        try { new URL(val); return true; } catch { return 'Must be a valid URL'; }
      },
    },
    {
      name: 'maps_url',
      type: 'text',
      admin: { description: 'Enlace Google Maps', placeholder: 'https://maps.google.com/...' },
      validate: (val: string | undefined) => {
        if (!val) return true;
        try { new URL(val); return true; } catch { return 'Must be a valid URL'; }
      },
    },

    // ====================================================================
    // SCHEDULE
    // ====================================================================
    {
      name: 'schedule',
      type: 'group',
      label: 'Horarios',
      admin: { description: 'Horarios de apertura de la sede' },
      fields: [
        { name: 'weekdays', type: 'text', label: 'Lunes a Viernes', admin: { placeholder: '09:00 - 21:00' } },
        { name: 'saturday', type: 'text', label: 'Sabados', admin: { placeholder: '09:00 - 14:00' } },
        { name: 'sunday', type: 'text', label: 'Domingos', admin: { placeholder: 'Cerrado' } },
        { name: 'notes', type: 'text', label: 'Notas horario', admin: { placeholder: 'Agosto cerrado' } },
      ],
    },

    // ====================================================================
    // FACILITIES & SERVICES
    // ====================================================================
    {
      name: 'capacity',
      type: 'number',
      admin: { description: 'Aforo maximo total de la sede', placeholder: '200' },
      min: 0,
    },
    {
      name: 'classrooms',
      type: 'array',
      label: 'Aulas',
      admin: { description: 'Aulas y salas disponibles en esta sede' },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Nombre del aula', admin: { placeholder: 'Aula 1' } },
        { name: 'capacity', type: 'number', label: 'Capacidad', min: 1, admin: { placeholder: '30' } },
        { name: 'floor', type: 'text', label: 'Planta', admin: { placeholder: 'Planta baja' } },
        {
          name: 'equipment',
          type: 'select',
          hasMany: true,
          label: 'Equipamiento',
          options: [
            { label: 'Proyector', value: 'projector' },
            { label: 'Pizarra digital', value: 'digital_board' },
            { label: 'Pizarra blanca', value: 'whiteboard' },
            { label: 'WiFi', value: 'wifi' },
            { label: 'Ordenadores', value: 'computers' },
            { label: 'Aire acondicionado', value: 'ac' },
            { label: 'Audio/Video', value: 'av_system' },
            { label: 'Laboratorio', value: 'lab' },
            { label: 'Taller practico', value: 'workshop' },
          ],
        },
        { name: 'active', type: 'checkbox', defaultValue: true, label: 'Activa' },
      ],
    },
    {
      name: 'services',
      type: 'select',
      hasMany: true,
      label: 'Servicios disponibles',
      admin: { description: 'Servicios e instalaciones de la sede' },
      options: [
        { label: 'WiFi gratuito', value: 'wifi' },
        { label: 'Aparcamiento', value: 'parking' },
        { label: 'Cafeteria', value: 'cafeteria' },
        { label: 'Biblioteca', value: 'library' },
        { label: 'Acceso movilidad reducida', value: 'accessibility' },
        { label: 'Ascensor', value: 'elevator' },
        { label: 'Sala de estudio', value: 'study_room' },
        { label: 'Taquillas', value: 'lockers' },
        { label: 'Transporte publico cercano', value: 'public_transport' },
        { label: 'Secretaria presencial', value: 'front_desk' },
        { label: 'Zona descanso', value: 'break_area' },
      ],
    },
    {
      name: 'parking',
      type: 'group',
      label: 'Aparcamiento',
      admin: { description: 'Informacion de parking' },
      fields: [
        { name: 'available', type: 'checkbox', label: 'Disponible', defaultValue: false },
        { name: 'spaces', type: 'number', label: 'Plazas', min: 0 },
        { name: 'free', type: 'checkbox', label: 'Gratuito', defaultValue: true },
        { name: 'notes', type: 'text', label: 'Notas', admin: { placeholder: 'Parking publico a 50m' } },
      ],
    },

    // ====================================================================
    // STAFF & COORDINATION
    // ====================================================================
    {
      name: 'coordinator',
      type: 'relationship',
      relationTo: 'staff',
      admin: { description: 'Coordinador/responsable de la sede' },
      filterOptions: () => ({ is_active: { equals: true } }),
    },
    {
      name: 'staff_members',
      type: 'relationship',
      relationTo: 'staff',
      hasMany: true,
      admin: { description: 'Personal asignado a esta sede (profesores y administrativos)' },
      filterOptions: () => ({ is_active: { equals: true } }),
    },

    // ====================================================================
    // NOTES (Cycles/Courses are NOT assigned to campuses — they live independently.
    // Convocatorias (CourseRuns) are the entities assigned to campuses via course_runs.campus field.)
    // ====================================================================
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Notas internas (no visible para alumnos)', rows: 3 },
    },

    // ====================================================================
    // TENANT
    // ====================================================================
    tenantField,
  ],
  hooks: {
    afterChange: [ensureDefaultClassroom],
    beforeValidate: [
      ({ data }): CampusData | undefined => {
        const typedData = data as CampusData | undefined;
        if (!typedData) return typedData;
        if (typedData.name && !typedData.slug) {
          typedData.slug = typedData.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }
        if (typedData.name) typedData.name = typedData.name.trim();
        if (typedData.city) typedData.city = typedData.city.trim();
        return typedData;
      },
    ],
    beforeChange: [
      ({ data }): CampusData | undefined => {
        const typedData = data as CampusData | undefined;
        if (!typedData) return typedData;
        const primaryId = relationId(typedData.primary_location);
        const serviceIds = Array.isArray(typedData.service_locations)
          ? typedData.service_locations.map(relationId).filter((id): id is number => id !== null)
          : [];
        if (primaryId !== null) {
          typedData.service_locations = ensurePrimaryInServiceLocations(
            String(primaryId),
            serviceIds.map(String),
          ).map(Number);
        }
        const result = campusSchema.safeParse(typedData);
        if (!result.success) {
          const errors = formatValidationErrors(result.error);
          console.error('Campus validation failed:', errors);
        }
        return typedData;
      },
    ],
  },
  timestamps: true,
  defaultSort: 'name',
};

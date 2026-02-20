import type { CollectionConfig, FieldHook } from 'payload';
import { canManageCampuses } from './access/canManageCampuses';
import { campusSchema, formatValidationErrors } from './Campuses.validation';
import { tenantField } from '../../access/tenantAccess';

/**
 * Data structure for Campus used in collection hooks
 */
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
  tenant?: number;
}

/**
 * Typed field hook for trimming string values
 * Returns the trimmed value or undefined
 */
const trimFieldHook: FieldHook = ({ value }) => {
  return typeof value === 'string' ? value.trim() : value;
};

/**
 * Campuses Collection
 *
 * Represents physical locations (campuses) where CEP Comunicación operates
 * and offers courses. Each campus has contact information and location details.
 *
 * Database: PostgreSQL table 'campuses'
 * Access Control:
 * - Read: Public (anonymous users can view campuses)
 * - Create/Update/Delete: Admin and Gestor roles only
 *
 * Key Features:
 * - Auto-slug generation from name if not provided
 * - Unique slug constraint enforced at database level
 * - Email, phone, and postal code validation
 * - Google Maps URL support
 * - Timestamps (createdAt, updatedAt)
 * - Zod schema validation for type safety
 *
 * Validation Rules:
 * - Postal Code: Spanish format (5 digits)
 * - Phone: Spanish format (+34 XXX XXX XXX)
 * - Email: Standard email validation
 * - Maps URL: Valid URL format
 */
export const Campuses: CollectionConfig = {
  slug: 'campuses',
  labels: {
    singular: 'Campus',
    plural: 'Campuses',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'phone', 'email'],
    group: 'Core',
    description: 'Physical locations where courses are offered',
  },
  access: {
    read: () => true, // Public read access
    create: canManageCampuses,
    update: canManageCampuses,
    delete: canManageCampuses,
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
        description: 'Display name of the campus (e.g., "Madrid Centro")',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Name is required';
        const trimmed = val.trim();
        if (trimmed.length < 3) return 'Name must be at least 3 characters';
        if (trimmed.length > 100) return 'Name must be less than 100 characters';
        return true;
      },
      hooks: {
        beforeChange: [trimFieldHook],
      },
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'City where the campus is located (e.g., "Madrid")',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'City is required';
        const trimmed = val.trim();
        if (trimmed.length < 2) return 'City must be at least 2 characters';
        if (trimmed.length > 50) return 'City must be less than 50 characters';
        return true;
      },
      hooks: {
        beforeChange: [trimFieldHook],
      },
    },
    {
      name: 'address',
      type: 'textarea',
      admin: {
        description: 'Full street address of the campus',
        rows: 2,
      },
      validate: (val: string | undefined) => {
        if (val && val.length > 200) {
          return 'Address must be less than 200 characters';
        }
        return true;
      },
    },
    {
      name: 'postal_code',
      type: 'text',
      admin: {
        description: 'Spanish postal code (5 digits, e.g., "28001")',
        placeholder: '28001',
      },
      validate: (val: string | undefined) => {
        if (!val) return true; // Optional field
        if (!/^\d{5}$/.test(val)) {
          return 'Postal code must be exactly 5 digits (e.g., "28001")';
        }
        return true;
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Spanish phone number format: +34 XXX XXX XXX',
        placeholder: '+34 912 345 678',
      },
      validate: (val: string | undefined) => {
        if (!val) return true; // Optional field
        if (!/^\+34\s\d{3}\s\d{3}\s\d{3}$/.test(val)) {
          return 'Phone must be in format: +34 XXX XXX XXX (e.g., "+34 912 345 678")';
        }
        return true;
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Contact email for the campus',
        placeholder: 'madrid@cepcomunicacion.com',
      },
      validate: (val: string | undefined) => {
        if (!val) return true; // Optional field
        // Email type field already validates email format
        // Additional custom validation can be added here
        if (val.length > 100) {
          return 'Email must be less than 100 characters';
        }
        return true;
      },
    },
    {
      name: 'maps_url',
      type: 'text',
      admin: {
        description: 'Google Maps URL for the campus location',
        placeholder: 'https://maps.google.com/?q=Madrid+Centro',
      },
      validate: (val: string | undefined) => {
        if (!val) return true; // Optional field
        try {
          new URL(val);
          return true;
        } catch {
          return 'Maps URL must be a valid URL (e.g., "https://maps.google.com/...")';
        }
      },
    },

    // ============================================================================
    // STAFF ASSIGNMENT
    // ============================================================================

    {
      name: 'staff_members',
      type: 'relationship',
      relationTo: 'staff',
      hasMany: true,
      admin: {
        description: 'Staff members (professors and administrativos) assigned to this campus',
      },
      filterOptions: () => {
        return {
          is_active: { equals: true },
        };
      },
    },

    /**
     * Tenant - Multi-tenant support
     * Associates campus with a specific academy/organization
     * Auto-assigned based on user's tenant on creation
     */
    tenantField,
  ],
  hooks: {
    beforeValidate: [
      ({ data }): CampusData | undefined => {
        const typedData = data as CampusData | undefined;
        if (!typedData) return typedData;

        // Auto-generate slug from name if not provided
        if (typedData.name && !typedData.slug) {
          typedData.slug = typedData.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }

        // Trim whitespace from name and city
        if (typedData.name) {
          typedData.name = typedData.name.trim();
        }
        if (typedData.city) {
          typedData.city = typedData.city.trim();
        }

        return typedData;
      },
    ],
    beforeChange: [
      ({ data }): CampusData | undefined => {
        const typedData = data as CampusData | undefined;
        // Validate entire payload with Zod schema
        const result = campusSchema.safeParse(typedData);

        if (!result.success) {
          const errors = formatValidationErrors(result.error);
          console.error('Campus validation failed:', errors);
          // Payload will handle field-level validation,
          // this is an additional layer for complex validation
        }

        return typedData;
      },
    ],
  },
  timestamps: true,
  defaultSort: 'name',
};

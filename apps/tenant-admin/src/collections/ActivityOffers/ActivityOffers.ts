import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'
import { ACTIVITY_KINDS, OFFER_SOURCE_TYPES, VENUE_KINDS } from '../../domain/activity-offer'

const staffRead = ({ req }: { req: { user?: { role?: string } | null } }) => Boolean(req.user)
const staffWrite = ({ req }: { req: { user?: { role?: string } | null } }) => {
  if (!req.user) return false
  return ['marketing', 'gestor', 'admin', 'superadmin'].includes(req.user.role ?? '')
}

export const ActivityOffers: CollectionConfig = {
  slug: 'activity-offers',
  labels: { singular: 'Oferta de actividad', plural: 'Ofertas de actividad' },
  admin: {
    useAsTitle: 'title',
    group: 'Marketing',
    description: 'Landing de pago opcional para talleres y actividades. Default-off.',
    defaultColumns: ['title', 'activity_kind', 'checkout_enabled', 'public_slug', 'updatedAt'],
  },
  access: {
    read: staffRead,
    create: staffWrite,
    update: staffWrite,
    delete: staffWrite,
  },
  fields: [
    tenantField,
    { name: 'title', type: 'text', required: true },
    { name: 'public_slug', type: 'text', required: true, index: true },
    {
      name: 'activity_kind',
      type: 'select',
      required: true,
      defaultValue: 'workshop',
      options: ACTIVITY_KINDS.map((value) => ({ label: value, value })),
    },
    { name: 'description', type: 'textarea' },
    { name: 'cover_url', type: 'text' },
    { name: 'starts_at', type: 'date' },
    { name: 'ends_at', type: 'date' },
    { name: 'schedule_text', type: 'text' },
    {
      name: 'venue_kind',
      type: 'select',
      defaultValue: 'in_person',
      options: VENUE_KINDS.map((value) => ({ label: value, value })),
    },
    { name: 'venue_label', type: 'text' },
    { name: 'host_name', type: 'text' },
    { name: 'capacity', type: 'number', min: 0, defaultValue: 0 },
    { name: 'seats_taken', type: 'number', min: 0, defaultValue: 0 },
    { name: 'waitlist_enabled', type: 'checkbox', defaultValue: true },
    { name: 'amount_cents', type: 'number', min: 0, defaultValue: 0 },
    { name: 'currency', type: 'text', defaultValue: 'eur' },
    {
      name: 'checkout_enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'La landing de pago permanece oculta hasta activar esto y conectar Stripe' },
    },
    {
      name: 'source_type',
      type: 'select',
      required: true,
      defaultValue: 'standalone',
      options: OFFER_SOURCE_TYPES.map((value) => ({ label: value, value })),
    },
    {
      name: 'source_course_run',
      type: 'relationship',
      relationTo: 'course-runs',
      index: true,
    },
    {
      name: 'seat_holds',
      type: 'json',
      admin: { hidden: true },
    },
  ],
  timestamps: true,
}

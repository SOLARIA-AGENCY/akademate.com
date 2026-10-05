export type PlanKey = 'starter' | 'pro' | 'enterprise'

export type PlanEntitlement = 'included' | 'paid-extension' | 'enterprise-scope' | 'not-included'

export type PlanComparisonRow = {
  id: string
  capability: string
  description: string
  starter: PlanEntitlement
  pro: PlanEntitlement
  enterprise: PlanEntitlement
}

export type PlanComparisonSection = {
  id: string
  title: string
  description: string
  rows: readonly PlanComparisonRow[]
}

export const planLabels: Record<PlanKey, string> = {
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export const entitlementLabels: Record<PlanEntitlement, string> = {
  included: 'Included',
  'paid-extension': 'Paid extension',
  'enterprise-scope': 'Enterprise scope',
  'not-included': 'Not included',
}

export const entitlementDescriptions: Record<PlanEntitlement, string> = {
  included: 'Part of the plan',
  'paid-extension': 'Added to the plan by proposal',
  'enterprise-scope': 'Configured in an Enterprise agreement',
  'not-included': 'Not part of this plan',
}

export const planComparisonSections: readonly PlanComparisonSection[] = [
  {
    id: 'academy-operations',
    title: 'Academy operations',
    description: 'The everyday workspace for running people, programmes and locations.',
    rows: [
      {
        id: 'academy-profile',
        capability: 'Academy profile and workspace',
        description: 'One operational record for your academy team.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'courses-and-schedules',
        capability: 'Courses, cohorts and schedules',
        description: 'Plan programmes, sessions, teachers and capacity.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'students-and-contacts',
        capability: 'Students, contacts and enrolments',
        description: 'Keep learner records and enrolment workflows together.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'multi-site',
        capability: 'Multi-site operations',
        description: 'Coordinate campuses, rooms and teams across locations.',
        starter: 'not-included',
        pro: 'included',
        enterprise: 'included',
      },
    ],
  },
  {
    id: 'public-academy-growth',
    title: 'Public academy and growth',
    description: 'Turn discovery into registrations with a connected public experience.',
    rows: [
      {
        id: 'academy-website',
        capability: 'Academy website and offer pages',
        description: 'Publish a branded academy presence and programme pages.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'lead-capture',
        capability: 'Lead capture and follow-up',
        description: 'Collect enquiries and keep the next action visible.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'course-registration-pages',
        capability: 'Shareable course registration pages',
        description: 'Share a focused page for discovery, registration and payment.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'paid-media-connectors',
        capability: 'Meta Ads and Google Ads connectors',
        description: 'Connect campaign data and attribution with provider accounts.',
        starter: 'paid-extension',
        pro: 'paid-extension',
        enterprise: 'paid-extension',
      },
    ],
  },
  {
    id: 'campus-learning',
    title: 'Campus and learning',
    description: 'Give teachers and learners one place for delivery, progress and support.',
    rows: [
      {
        id: 'virtual-campus',
        capability: 'Virtual campus and course spaces',
        description: 'Organise learning materials, activities and learner access.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'attendance',
        capability: 'Manual attendance and participation records',
        description: 'Record attendance from the academy workspace for in-person and online sessions.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'assessment-and-certificates',
        capability: 'Assessments and digital certificates',
        description: 'Record outcomes and issue branded completion evidence.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'teacher-learner-chat',
        capability: 'Teacher and learner conversations',
        description: 'Keep course communication close to the learning context.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
    ],
  },
  {
    id: 'finance-and-controls',
    title: 'Finance and controls',
    description: 'Connect commercial activity with the records your team needs to operate.',
    rows: [
      {
        id: 'payments',
        capability: 'Online payments and payment links',
        description: 'Collect registrations through supported payment providers.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'finance-connectors',
        capability: 'Finance and accounting connectors',
        description: 'Map academy activity to the finance tools you use.',
        starter: 'paid-extension',
        pro: 'paid-extension',
        enterprise: 'included',
      },
      {
        id: 'permissions-and-audit',
        capability: 'Role-based permissions and audit trail',
        description: 'Give each team member the right operational view.',
        starter: 'included',
        pro: 'included',
        enterprise: 'included',
      },
      {
        id: 'sso-scim',
        capability: 'SSO, SCIM and enterprise identity',
        description: 'Align access with your organisation identity provider.',
        starter: 'enterprise-scope',
        pro: 'enterprise-scope',
        enterprise: 'enterprise-scope',
      },
    ],
  },
  {
    id: 'connected-campus-extensions',
    title: 'Connected campus extensions',
    description: 'Extend the workspace to physical spaces with a scoped deployment.',
    rows: [
      {
        id: 'qr-mobile-attendance',
        capability: 'QR attendance and mobile check-in',
        description: 'Add a faster check-in flow for defined programmes or sites.',
        starter: 'paid-extension',
        pro: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        id: 'nfc-rfid',
        capability: 'NFC and RFID identities',
        description: 'Connect cards or tags to an agreed attendance workflow.',
        starter: 'paid-extension',
        pro: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        id: 'physical-access',
        capability: 'Physical access readers and sensors',
        description: 'Coordinate access events with supported hardware adapters.',
        starter: 'paid-extension',
        pro: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        id: 'digital-signage',
        capability: 'Digital Signage',
        description: 'Publish schedules, notices and academy communications to screens.',
        starter: 'paid-extension',
        pro: 'paid-extension',
        enterprise: 'paid-extension',
      },
    ],
  },
] as const

export const paidExtensions = [
  {
    id: 'connected-campus',
    title: 'Connected campus',
    includes: 'QR check-in, NFC/RFID identity workflows, access adapters and attendance events.',
    separateCosts:
      'Cards, tags, readers, sensors, installation, connectivity and provider licences are quoted separately.',
  },
  {
    id: 'digital-signage',
    title: 'Digital Signage',
    includes: 'Screen playlists for schedules, announcements and academy campaigns.',
    separateCosts:
      'Screens, players, mounts, installation, connectivity and third-party licences are quoted separately.',
  },
] as const

export const separatelyBilledItems = [
  'Hardware, cards, tags, readers and sensors',
  'Screens, players, mounts and installation',
  'Connectivity and on-site technical services',
  'Third-party provider licences and advertising media spend',
  'Payment processor fees and applicable taxes',
] as const

export const allPricingRows = planComparisonSections.flatMap((section) => section.rows)

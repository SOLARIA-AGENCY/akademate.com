export type PlanEntitlement = 'included' | 'paid-extension' | 'enterprise-scope' | 'not-included'

export type PlanComparisonRow = {
  capability: string
  launch: PlanEntitlement
  business: PlanEntitlement
  enterprise: PlanEntitlement
  note?: string
}

export type PlanComparisonSection = {
  title: string
  description: string
  rows: readonly PlanComparisonRow[]
}

export const entitlementLabels: Record<PlanEntitlement, string> = {
  included: 'Included',
  'paid-extension': 'Paid extension',
  'enterprise-scope': 'Enterprise scope',
  'not-included': 'Not included',
}

export const planComparisonSections: readonly PlanComparisonSection[] = [
  {
    title: 'Website, catalogue and enrolment',
    description: 'Publish offers and turn interest into confirmed participation.',
    rows: [
      {
        capability: 'Akademate subdomain',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Shareable course and event pages',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Registration, capacity and waitlists',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Embedded forms and payments',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Complete academy website and CMS',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Custom domain connection',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
        note: 'Domain registration and third-party DNS services are billed separately.',
      },
      {
        capability: 'Blog, SEO and social previews',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
    ],
  },
  {
    title: 'Growth, CRM and admissions',
    description: 'Capture, qualify and convert demand across the admissions journey.',
    rows: [
      {
        capability: 'Lead capture and source tracking',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Reservations and admissions workflow',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'CRM pipeline and team assignment',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Confirmations and operational reminders',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Workflow automation',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Campaign attribution and growth dashboard',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        capability: 'Meta Ads and Google Ads connectors',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
        note: 'Advertising spend and provider fees remain separate.',
      },
    ],
  },
  {
    title: 'Academy operations and people',
    description: 'Coordinate programmes, people, schedules and locations.',
    rows: [
      {
        capability: 'Courses, cohorts and schedules',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Participant and learner records',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Teacher and staff workspaces',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Core attendance and capacity',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Roles and permission workspaces',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Multiple campuses',
        launch: 'not-included',
        business: 'paid-extension',
        enterprise: 'included',
      },
      {
        capability: 'Multi-brand and multi-entity operations',
        launch: 'not-included',
        business: 'not-included',
        enterprise: 'enterprise-scope',
      },
    ],
  },
  {
    title: 'Virtual campus and learning',
    description: 'Deliver content, teaching, feedback and progress.',
    rows: [
      {
        capability: 'Virtual learner campus',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Teacher course workspace',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Lessons and learning materials',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Assignments, assessments and grades',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Teacher and learner chat',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Certificates and progress records',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Live video-class integrations',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
        note: 'Video-provider licences are billed by the provider.',
      },
    ],
  },
  {
    title: 'Payments and financial control',
    description: 'Connect collection, participant balances and operational reporting.',
    rows: [
      {
        capability: 'Checkout and one-off payments',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Deposits and payment deadlines',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Instalments and subscriptions',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Memberships and session packs',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Receivables and finance reporting',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Stripe, PayPal and SEPA adapters',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
        note: 'Processor onboarding and transaction fees are separate.',
      },
      {
        capability: 'Accounting, banking and ERP connectors',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
      },
    ],
  },
  {
    title: 'Platform, security and service',
    description: 'Choose the operating, integration and support model.',
    rows: [
      {
        capability: 'Managed cloud service',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Core operational analytics',
        launch: 'paid-extension',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'Standard onboarding',
        launch: 'included',
        business: 'included',
        enterprise: 'included',
      },
      {
        capability: 'API and webhooks',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'included',
      },
      {
        capability: 'Dedicated private cloud or on-premise',
        launch: 'not-included',
        business: 'not-included',
        enterprise: 'enterprise-scope',
      },
      {
        capability: 'SSO, audit and contracted security controls',
        launch: 'not-included',
        business: 'paid-extension',
        enterprise: 'enterprise-scope',
      },
      {
        capability: 'Migration and custom integration programme',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'enterprise-scope',
      },
    ],
  },
  {
    title: 'Paid operational extensions',
    description: 'Specialist modules added to any eligible commercial scope.',
    rows: [
      {
        capability: 'QR attendance and mobile check-in',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        capability: 'NFC and RFID identities',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        capability: 'Physical access readers and sensors',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
        note: 'Hardware, installation and provider licences are separate.',
      },
      {
        capability: 'Digital Signage',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
        note: 'Screens, players, installation and external licences are separate.',
      },
      {
        capability: 'Advanced finance and accounting',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        capability: 'HR and workforce management',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        capability: 'Library, inventory and facilities',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
      },
      {
        capability: 'AI workspace and MCP',
        launch: 'paid-extension',
        business: 'paid-extension',
        enterprise: 'paid-extension',
        note: 'Model and AI-provider usage is billed separately where applicable.',
      },
    ],
  },
] as const

export const paidExtensions = [
  {
    id: 'access',
    title: 'Attendance and physical access',
    summary: 'Connect arrivals to learner, class and campus records.',
    includes: ['QR mobile check-in', 'NFC and RFID identities', 'Reader and sensor adapters'],
    separateCosts: 'Hardware and licences.',
  },
  {
    id: 'signage',
    title: 'Digital Signage',
    summary: 'Schedule live academy communications across every site.',
    includes: [
      'Calendars and room schedules',
      'Announcements and promotions',
      'Display status monitoring',
    ],
    separateCosts: 'Screens, players and installation.',
  },
  {
    id: 'growth',
    title: 'Growth and Ads',
    summary: 'Connect campaign signals with leads, applications and enrolments.',
    includes: ['Meta and Google connectors', 'Attribution dashboard', 'Campaign workflows'],
    separateCosts: 'Media spend and platform fees.',
  },
  {
    id: 'finance',
    title: 'Advanced finance and accounting',
    summary: 'Extend academy billing into accounting and reconciliation.',
    includes: ['Ledger and cost centres', 'Bank reconciliation', 'Accounting and ERP adapters'],
    separateCosts: 'Accounting subscriptions.',
  },
  {
    id: 'workforce',
    title: 'HR and workforce',
    summary: 'Coordinate contracts, availability, workload and payroll inputs.',
    includes: ['Staff records', 'Workload and substitutions', 'Payroll preparation'],
    separateCosts: 'Payroll services and integrations.',
  },
  {
    id: 'resources',
    title: 'Library, inventory and facilities',
    summary: 'Manage shared learning resources, equipment and spaces.',
    includes: ['Library and loans', 'Inventory and equipment', 'Facilities and maintenance'],
    separateCosts: 'Tags, scanners and equipment.',
  },
  {
    id: 'agentic',
    title: 'AI workspace and MCP',
    summary: 'Connect approved AI clients to permission-aware academy tools.',
    includes: ['MCP connection', 'Read and draft tools', 'Approval-aware actions'],
    separateCosts: 'AI provider usage fees.',
  },
  {
    id: 'implementation',
    title: 'Migration and custom integrations',
    summary: 'Move data and connect specialist systems through a scoped programme.',
    includes: ['Data mapping', 'Reconciled migration rehearsals', 'Custom API adapters'],
    separateCosts: 'Data cleanup and development.',
  },
] as const

export const separatelyBilledItems = [
  'Payment-provider transaction and account fees',
  'Advertising spend and external campaign production',
  'Domains, messaging, video and third-party software licences',
  'Access-control hardware, cards, readers, sensors and installation',
  'Digital Signage screens, players, mounting and installation',
  'Custom migration, data remediation and bespoke integration work',
] as const

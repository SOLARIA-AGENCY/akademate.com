import type { IntegrationBrandId } from '@/lib/integration-brands'

type ModuleDetail = {
  title: string
  audiences: string[]
  signal: string
  signalLabel: string
  previewTitle: string
  previewRows: Array<{ label: string; value: string }>
  connectors: IntegrationBrandId[]
}

export const featureModuleDetails: ModuleDetail[] = [
  {
    title: 'Website, catalogue and embeds',
    audiences: ['Growth', 'Operations'],
    signal: '3',
    signalLabel: 'publishing modes',
    previewTitle: 'Public academy',
    previewRows: [
      { label: 'Custom domain', value: 'Connected' },
      { label: 'Course catalogue', value: '12 live offers' },
      { label: 'Embedded checkout', value: 'Ready' },
    ],
    connectors: ['cloudflare'],
  },
  {
    title: 'Growth, Ads and CRM',
    audiences: ['Growth', 'Admissions'],
    signal: '24%',
    signalLabel: 'lead-to-application',
    previewTitle: 'Campaign pipeline',
    previewRows: [
      { label: 'Meta campaign', value: '36 leads' },
      { label: 'Google Search', value: '18 leads' },
      { label: 'Follow-up due', value: '7 today' },
    ],
    connectors: ['meta', 'googleads'],
  },
  {
    title: 'Campaign intelligence',
    audiences: ['Growth', 'Leadership'],
    signal: 'Illustrative',
    signalLabel: 'provider and CRM signals',
    previewTitle: 'Campaign dashboard',
    previewRows: [
      { label: 'Paid sources', value: 'Meta · Google' },
      { label: 'Metric freshness', value: 'Visible' },
      { label: 'Attribution model', value: 'Configurable' },
    ],
    connectors: ['meta', 'googleads'],
  },
  {
    title: 'Reservations and admissions',
    audiences: ['Admissions', 'Learners'],
    signal: '42',
    signalLabel: 'active applications',
    previewTitle: 'Admissions queue',
    previewRows: [
      { label: 'Ready to review', value: '12' },
      { label: 'Awaiting documents', value: '8' },
      { label: 'Places held', value: '6' },
    ],
    connectors: ['googlecalendar'],
  },
  {
    title: 'Offers, runs and capacity',
    audiences: ['Operations', 'Growth'],
    signal: '86%',
    signalLabel: 'current occupancy',
    previewTitle: 'Offer capacity',
    previewRows: [
      { label: 'Evening cohort', value: '3 places' },
      { label: 'Saturday workshop', value: 'Waitlist' },
      { label: 'Online intake', value: 'Open' },
    ],
    connectors: ['googlecalendar', 'zoom'],
  },
  {
    title: 'Academic operations',
    audiences: ['Academic team', 'Teachers'],
    signal: '18',
    signalLabel: 'sessions today',
    previewTitle: 'Daily operation',
    previewRows: [
      { label: 'Central campus', value: '8 sessions' },
      { label: 'North campus', value: '6 sessions' },
      { label: 'Online campus', value: '4 sessions' },
    ],
    connectors: ['googlecalendar', 'googlemeet'],
  },
  {
    title: 'Attendance and physical access',
    audiences: ['Operations', 'Learners'],
    signal: '92%',
    signalLabel: 'attendance today',
    previewTitle: 'Campus arrivals',
    previewRows: [
      { label: 'QR check-ins', value: '184' },
      { label: 'NFC and RFID', value: '63' },
      { label: 'Exceptions', value: '4 to review' },
    ],
    connectors: [],
  },
  {
    title: 'Students, members and participants',
    audiences: ['Administration', 'Learners'],
    signal: '1,284',
    signalLabel: 'connected profiles',
    previewTitle: 'Participant record',
    previewRows: [
      { label: 'Enrolments', value: '3 active' },
      { label: 'Attendance', value: '92%' },
      { label: 'Documents', value: 'Complete' },
    ],
    connectors: ['auth0'],
  },
  {
    title: 'Organisation, brands and domains',
    audiences: ['Leadership', 'IT'],
    signal: '4',
    signalLabel: 'connected campuses',
    previewTitle: 'Academy structure',
    previewRows: [
      { label: 'Main academy', value: 'Primary brand' },
      { label: 'Locations', value: '3 physical' },
      { label: 'Online campus', value: '1 global' },
    ],
    connectors: ['cloudflare', 'auth0'],
  },
  {
    title: 'Teaching and staff operations',
    audiences: ['Teachers', 'HR'],
    signal: '28',
    signalLabel: 'teachers scheduled',
    previewTitle: 'Teacher workspace',
    previewRows: [
      { label: 'Classes today', value: '4' },
      { label: 'Submissions', value: '8 to review' },
      { label: 'Private messages', value: '3 new' },
    ],
    connectors: ['zoom', 'googlemeet'],
  },
  {
    title: 'Virtual campus and learning',
    audiences: ['Learners', 'Teachers'],
    signal: '78%',
    signalLabel: 'weekly engagement',
    previewTitle: 'Learner campus',
    previewRows: [
      { label: 'Next lesson', value: 'Today, 18:00' },
      { label: 'Assignment', value: 'Due Friday' },
      { label: 'Course progress', value: '7 of 10 units' },
    ],
    connectors: ['zoom', 'googlemeet', 'youtube', 'vimeo'],
  },
  {
    title: 'Communication and community',
    audiences: ['Everyone'],
    signal: '96%',
    signalLabel: 'messages delivered',
    previewTitle: 'Communication centre',
    previewRows: [
      { label: 'Class reminder', value: 'Sent' },
      { label: 'Teacher chat', value: '2 unread' },
      { label: 'Payment follow-up', value: 'Scheduled' },
    ],
    connectors: ['whatsapp', 'twilio'],
  },
  {
    title: 'Digital signage',
    audiences: ['Operations', 'Growth'],
    signal: '12',
    signalLabel: 'connected displays',
    previewTitle: 'Screen network',
    previewRows: [
      { label: 'Class calendars', value: '6 live' },
      { label: 'Announcements', value: '3 scheduled' },
      { label: 'Display status', value: '12 online' },
    ],
    connectors: [],
  },
  {
    title: 'Payments, billing and finance',
    audiences: ['Finance', 'Learners'],
    signal: '€48k',
    signalLabel: 'collected this month',
    previewTitle: 'Payment operation',
    previewRows: [
      { label: 'Paid enrolments', value: '184' },
      { label: 'Instalments due', value: '23' },
      { label: 'Refund review', value: '2' },
    ],
    connectors: ['stripe', 'paypal', 'sepa', 'visa', 'mastercard', 'applepay', 'googlepay'],
  },
  {
    title: 'Finance and accounting',
    audiences: ['Finance', 'Leadership'],
    signal: '98.4%',
    signalLabel: 'payments reconciled',
    previewTitle: 'Finance close',
    previewRows: [
      { label: 'Receivables', value: '€12,420' },
      { label: 'Unmatched payments', value: '4' },
      { label: 'Campus margin', value: 'View report' },
    ],
    connectors: ['xero', 'quickbooks', 'sage'],
  },
  {
    title: 'HR and workforce',
    audiences: ['HR', 'Leadership'],
    signal: '312h',
    signalLabel: 'teaching scheduled',
    previewTitle: 'Workforce plan',
    previewRows: [
      { label: 'Available teachers', value: '18' },
      { label: 'Cover required', value: '2 sessions' },
      { label: 'Qualifications', value: '3 renewals' },
    ],
    connectors: [],
  },
  {
    title: 'Library, inventory and facilities',
    audiences: ['Operations', 'Teachers'],
    signal: '94%',
    signalLabel: 'resources available',
    previewTitle: 'Resource control',
    previewRows: [
      { label: 'Items on loan', value: '38' },
      { label: 'Room maintenance', value: '1 action' },
      { label: 'Low stock', value: '4 items' },
    ],
    connectors: [],
  },
  {
    title: 'Sports and seasonal operations',
    audiences: ['Coaches', 'Families'],
    signal: '12',
    signalLabel: 'teams and groups',
    previewTitle: 'Season operation',
    previewRows: [
      { label: 'Trials this week', value: '24' },
      { label: 'Guardian consent', value: '91%' },
      { label: 'Facility capacity', value: 'Available' },
    ],
    connectors: ['googlecalendar'],
  },
  {
    title: 'Insight and reporting',
    audiences: ['Leadership', 'Operations'],
    signal: '+18%',
    signalLabel: 'enrolment growth',
    previewTitle: 'Academy performance',
    previewRows: [
      { label: 'Lead conversion', value: '24%' },
      { label: 'Attendance', value: '91%' },
      { label: 'Revenue forecast', value: 'On target' },
    ],
    connectors: [],
  },
  {
    title: 'AI-assisted workflows',
    audiences: ['Optional for every role'],
    signal: 'Human',
    signalLabel: 'review stays in control',
    previewTitle: 'Assisted action',
    previewRows: [
      { label: 'Summarise enquiry', value: 'Draft ready' },
      { label: 'Prepare reminder', value: 'Review required' },
      { label: 'Access scope', value: 'Permission-aware' },
    ],
    connectors: ['openai'],
  },
  {
    title: 'AI workspace and MCP',
    audiences: ['Optional for every role', 'IT'],
    signal: 'Scoped',
    signalLabel: 'tenant and role context',
    previewTitle: 'MCP workspace',
    previewRows: [
      { label: 'Read action', value: 'Summarise' },
      { label: 'Draft action', value: 'Review first' },
      { label: 'Write action', value: 'Approval required' },
    ],
    connectors: ['openai', 'claude', 'gemini'],
  },
  {
    title: 'Security and governance',
    audiences: ['IT', 'Privacy'],
    signal: 'Scoped',
    signalLabel: 'access by responsibility',
    previewTitle: 'Access controls',
    previewRows: [
      { label: 'Tenant boundary', value: 'Active' },
      { label: 'Role review', value: 'Due in 8 days' },
      { label: 'Audit context', value: 'Recorded' },
    ],
    connectors: ['okta', 'auth0'],
  },
  {
    title: 'APIs, webhooks and deployment',
    audiences: ['IT', 'Partners'],
    signal: '3',
    signalLabel: 'deployment models',
    previewTitle: 'Integration layer',
    previewRows: [
      { label: 'API access', value: 'Governed' },
      { label: 'Webhooks', value: 'Event-based' },
      { label: 'Deployment', value: 'Cloud or private' },
    ],
    connectors: ['zapier', 'make', 'n8n'],
  },
]

export const featureModuleDetailByTitle = Object.fromEntries(
  featureModuleDetails.map((detail) => [detail.title, detail])
) as Record<string, ModuleDetail>

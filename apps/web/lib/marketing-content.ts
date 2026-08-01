export const operatingJourney = [
  {
    step: '01',
    title: 'Discover',
    text: 'Turn every source into measurable demand.',
  },
  {
    step: '02',
    title: 'Reserve',
    text: 'Offer enquiry, booking, payment or waitlist.',
  },
  {
    step: '03',
    title: 'Confirm',
    text: 'Confirm capacity, consent and approval.',
  },
  {
    step: '04',
    title: 'Pay',
    text: 'Collect deposits and recurring fees.',
  },
  {
    step: '05',
    title: 'Deliver',
    text: 'Run teaching, attendance and campus.',
  },
  {
    step: '06',
    title: 'Grow',
    text: 'Connect growth, learning and finance signals.',
  },
] as const

export const reservationModes = [
  { title: 'Enquiry', text: 'Capture interest and route it to the right team.' },
  {
    title: 'Application',
    text: 'Review eligibility, documents or an assessment before confirming.',
  },
  {
    title: 'Place hold',
    text: 'Protect capacity for a defined period while requirements are completed.',
  },
  {
    title: 'Instant booking',
    text: 'Confirm a free or paid place immediately when the rules allow it.',
  },
  {
    title: 'Paid enrolment',
    text: 'Reserve, collect payment and start onboarding in one journey.',
  },
  { title: 'Waitlist', text: 'Keep demand organised and promote the next eligible participant.' },
] as const

export const distributionModes = [
  {
    title: 'Your Akademate website',
    label: 'academy.akademate.com',
    text: 'Launch a branded website connected to your operation.',
  },
  {
    title: 'Your own domain',
    label: 'www.youracademy.com',
    text: 'Connect your domain with guided DNS setup.',
  },
  {
    title: 'Embeds for any website',
    label: 'Courses · Classes · Forms · Payments',
    text: 'Embed live classes, forms and payments anywhere.',
  },
  {
    title: 'A page for every offer',
    label: 'Shareable course URL',
    text: 'Share one page for discovery, registration and payment.',
  },
] as const

export const academyExperiences = [
  {
    id: 'operations',
    label: 'Academy team',
    eyebrow: 'For directors and centre staff',
    title: 'Run your academy with clarity.',
    description: 'See enrolment, schedules, people and finance in one workspace.',
    image: '/images/marketing/akademate-operations-experience-v1.jpg',
    imageAlt:
      'Academy directors and administrative staff using Akademate to coordinate performance, schedules and learners',
    capabilities: [
      'Admissions and records',
      'Courses and timetables',
      'Multiple campuses',
      'Staff and resources',
      'Finance and reporting',
    ],
  },
  {
    id: 'teachers',
    label: 'Teachers',
    eyebrow: 'For teachers and coaches',
    title: 'Plan, teach and support in one place.',
    description: 'Plan classes, grade work and support learners privately.',
    image: '/images/marketing/akademate-teacher-experience-v1.jpg',
    imageAlt:
      'Teacher using Akademate for a hybrid class, course preparation, attendance, assignments and grades',
    capabilities: [
      'Course workspace',
      'In-person and live online classes',
      'Attendance',
      'Assignments and grades',
      'Private chat and feedback',
    ],
  },
  {
    id: 'learners',
    label: 'Learners',
    eyebrow: 'For learners and families',
    title: 'Know what comes next.',
    description: 'Learn, submit work and track progress from one campus.',
    image: '/images/marketing/akademate-learner-experience-v1.jpg',
    imageAlt:
      'Learner using the Akademate virtual campus on laptop and mobile alongside an in-person class',
    capabilities: [
      'Virtual campus',
      'Next classes and resources',
      'Assignments and grades',
      'Attendance and progress',
      'Private teacher chat',
    ],
  },
] as const

export { academySetupStages } from '@akademate/ui/academy-setup'

export const platformPillars = [
  {
    title: 'Web and commerce',
    text: 'Publish, enrol and sell from your own web presence.',
    capabilities: [
      'Website and CMS',
      'Domain and DNS',
      'Embeds',
      'Offer pages',
      'SEO and social sharing',
    ],
  },
  {
    title: 'Growth and admissions',
    text: 'Convert demand into qualified, confirmed enrolment.',
    capabilities: ['Leads and CRM', 'Campaigns', 'Admissions', 'Reservations', 'Automation'],
  },
  {
    title: 'Academic operations',
    text: 'Coordinate programmes, schedules, places and attendance.',
    capabilities: ['Courses', 'Cohorts', 'Schedules', 'Locations', 'Attendance'],
  },
  {
    title: 'People and workforce',
    text: 'Give every person the right workspace.',
    capabilities: ['Student records', 'Teacher workspace', 'Roles', 'HR', 'Workload'],
  },
  {
    title: 'Campus and learning',
    text: 'Deliver learning, feedback, progress and community.',
    capabilities: ['LMS', 'Gradebook', 'Chat', 'Certificates', 'Learner analytics'],
  },
  {
    title: 'Payments and finance',
    text: 'Connect collection, billing and financial control.',
    capabilities: ['Checkout', 'Billing', 'Receivables', 'Reconciliation', 'Accounting'],
  },
  {
    title: 'Library and resources',
    text: 'Keep shared resources available and accountable.',
    capabilities: ['Library', 'Inventory', 'Equipment', 'Facilities', 'Procurement'],
  },
  {
    title: 'Insight and ecosystem',
    text: 'Turn operations into insight and connected action.',
    capabilities: ['Analytics', 'Reports', 'APIs', 'Integrations', 'AI assistance'],
  },
] as const

export const roadmapModules = [
  {
    title: 'Finance and accounting',
    phase: 'Expansion roadmap',
    text: 'Ledger, reconciliation, banking and accounting connections.',
  },
  {
    title: 'HR and workforce',
    phase: 'Expansion roadmap',
    text: 'Contracts, availability, workload and payroll inputs.',
  },
  {
    title: 'Library and inventory',
    phase: 'Expansion roadmap',
    text: 'Libraries, equipment, stock, facilities and procurement.',
  },
  {
    title: 'Advanced learning',
    phase: 'Product roadmap',
    text: 'Assessment, pathways, certificates and moderated community.',
  },
  {
    title: 'Mobile experience',
    phase: 'Future platform',
    text: 'Responsive access, followed by dedicated Apple experiences.',
  },
  {
    title: 'AI-assisted operations',
    phase: 'Optional capability',
    text: 'Permission-aware assistance with human review.',
  },
] as const

export const verticals = [
  {
    slug: 'professional-training',
    title: 'Professional and regulated training',
    description: 'Admissions, cohorts, compliance and learner progress.',
    image: '/images/marketing/akademate-in-person-academy.jpg',
    imageAlt: 'Adult vocational learners working with a teacher in a modern training centre',
    capabilities: ['Admissions', 'Cohorts', 'Academic progress'],
  },
  {
    slug: 'wellness',
    title: 'Yoga, pilates and wellness studios',
    description: 'Classes, memberships, capacity and repeat booking.',
    image: '/images/marketing/akademate-wellness-studio.jpg',
    imageAlt: 'Yoga studio class coordinated by an instructor using a tablet',
    capabilities: ['Memberships', 'Session packs', 'Recurring classes'],
  },
  {
    slug: 'sports',
    title: 'Sports academies and clubs',
    description: 'Teams, guardians, seasons and athlete development.',
    image: '/images/marketing/akademate-sports-campus.jpg',
    imageAlt: 'Children taking part in a professionally organised outdoor sports academy',
    capabilities: ['Guardians', 'Teams', 'Seasons'],
  },
  {
    slug: 'seasonal',
    title: 'Seasonal camps',
    description: 'Launch, fill and operate time-bound programmes.',
    image: '/images/marketing/seasonal-campus-checkin.jpg',
    imageAlt: 'Summer sports campus with participant check-in and coached activities',
    capabilities: ['Fast launch', 'Deposits', 'Capacity'],
  },
  {
    slug: 'performing-arts',
    title: 'Music, dance and performing arts',
    description: 'Coordinate studios, lessons, performances and families.',
    image: '/images/marketing/akademate-performing-arts.jpg',
    imageAlt: 'Dance and music academy operating several classes in a shared studio',
    capabilities: ['Studios', 'Teachers', 'Recurring lessons'],
  },
  {
    slug: 'online-cohorts',
    title: 'Online schools and cohort programmes',
    description: 'Connect cohorts, learning, community and progress.',
    image: '/images/marketing/akademate-online-academy.jpg',
    imageAlt: 'Educator delivering a live online lesson from a professional teaching studio',
    capabilities: ['Virtual campus', 'Assignments', 'Community'],
  },
  {
    slug: 'languages',
    title: 'Language academies',
    description: 'Placement, levels, billing and hybrid delivery.',
    image: '/images/marketing/language-academy.jpg',
    imageAlt: 'Adult learners in a collaborative language academy class',
    capabilities: ['Placement', 'Levels', 'Monthly billing'],
  },
  {
    slug: 'networks',
    title: 'Multi-site groups and franchises',
    description: 'Shared standards with local operational control.',
    image: '/images/marketing/akademate-multisite-network.jpg',
    imageAlt: 'Education group leaders coordinating a multi-location training organisation',
    capabilities: ['Brands', 'Locations', 'Local finance'],
  },
] as const

export const solutionDetails = {
  'professional-training': {
    headline: 'Fill cohorts. Deliver with confidence.',
    promise: 'Connect admissions, delivery and progress for every cohort.',
    outcomes: [
      'Convert more enquiries into qualified applications',
      'Keep documentation and approvals moving',
      'Give teachers and learners one reliable campus',
      'See cohort performance and revenue together',
    ],
    workflow: [
      'Capture interest',
      'Review eligibility',
      'Confirm enrolment',
      'Deliver the programme',
    ],
    modules: [
      'Admissions CRM',
      'Cohorts and timetables',
      'Learner campus',
      'Payments and reporting',
    ],
  },
  languages: {
    headline: 'Fill classes. Simplify schedules.',
    promise: 'Connect placement, groups, billing and hybrid learning.',
    outcomes: [
      'Route learners to the right level',
      'Open groups around real demand',
      'Automate monthly payment journeys',
      'Keep classroom and online progress aligned',
    ],
    workflow: ['Placement', 'Group matching', 'Recurring booking', 'Progress'],
    modules: ['Placement and CRM', 'Levels and groups', 'Recurring billing', 'Hybrid campus'],
  },
  wellness: {
    headline: 'Build a studio members return to.',
    promise: 'Make every class easy to discover, book and renew.',
    outcomes: [
      'Make repeat booking effortless',
      'Protect room and instructor capacity',
      'Grow memberships and session packs',
      'Understand attendance and retention',
    ],
    workflow: ['Discover class', 'Book a place', 'Check in', 'Renew membership'],
    modules: ['Class booking', 'Memberships', 'Instructor schedules', 'Retention insight'],
  },
  sports: {
    headline: 'Run the season. Grow every athlete.',
    promise: 'Coordinate trials, teams, guardians and athlete progress.',
    outcomes: [
      'Turn trials into confirmed places',
      'Keep guardians informed',
      'Coordinate teams and facilities',
      'Track attendance and development',
    ],
    workflow: ['Trial', 'Assessment', 'Team placement', 'Season delivery'],
    modules: [
      'Trials and assessments',
      'Teams and guardians',
      'Facilities and schedules',
      'Attendance and progress',
    ],
  },
  seasonal: {
    headline: 'Launch your next camp in days.',
    promise: 'Publish, fill and run every seasonal programme.',
    outcomes: [
      'Publish a bookable programme quickly',
      'Manage weeks, age groups and capacity',
      'Collect deposits and documents',
      'Automate arrival information and reminders',
    ],
    workflow: ['Publish', 'Reserve', 'Prepare', 'Welcome'],
    modules: [
      'Launch pages',
      'Capacity and waitlists',
      'Deposits and documents',
      'Family communication',
    ],
  },
  'performing-arts': {
    headline: 'Keep performances in rhythm.',
    promise: 'Keep lessons, studios, families and performances in rhythm.',
    outcomes: [
      'Simplify recurring enrolment',
      'Coordinate studios and teachers',
      'Keep families close to progress',
      'Plan performances without fragmented lists',
    ],
    workflow: ['Choose discipline', 'Join a class', 'Build progress', 'Perform'],
    modules: ['Recurring lessons', 'Studio scheduling', 'Family accounts', 'Events and progress'],
  },
  'online-cohorts': {
    headline: 'Build every cohort into a community.',
    promise: 'Unite enrolment, live learning, community and progress.',
    outcomes: [
      'Create a premium enrolment journey',
      'Give learners one digital home',
      'Help teachers act on progress',
      'Keep community active between sessions',
    ],
    workflow: ['Apply', 'Onboard', 'Learn together', 'Complete'],
    modules: [
      'Cohort admissions',
      'Virtual campus',
      'Assignments and chat',
      'Progress and completion',
    ],
  },
  networks: {
    headline: 'One brand. Every location in control.',
    promise: 'Scale shared standards while every location stays in control.',
    outcomes: [
      'Launch new locations with shared standards',
      'Keep local teams focused on their operation',
      'Separate domains and payment responsibility',
      'See network performance in one view',
    ],
    workflow: ['Define standards', 'Configure location', 'Operate locally', 'Learn as a network'],
    modules: ['Brands and domains', 'Location workspaces', 'Scoped finance', 'Network reporting'],
  },
} as const

export const featureGroups = [
  {
    title: 'Website, catalogue and embeds',
    eyebrow: 'Publish anywhere',
    description: 'Launch a connected website, domain or embedded journey.',
    features: [
      'Automatic Akademate subdomain',
      'Custom domains and guided DNS',
      'Course and workshop pages',
      'Embeddable classes, forms and payments',
      'Reviews, testimonials and social sharing',
    ],
  },
  {
    title: 'Growth, Ads and CRM',
    eyebrow: 'Build demand',
    description: 'Follow every lead from campaign to enrolment.',
    features: [
      'Lead capture and qualification',
      'Campaign and UTM attribution',
      'Meta Ads and conversion context',
      'MCP connector layer',
      'Follow-up and enrolment handoff',
    ],
  },
  {
    title: 'Campaign intelligence',
    eyebrow: 'Understand paid growth',
    description: 'Connect campaign signals to attributed enrolment.',
    features: [
      'Meta Ads and Google Ads sources',
      'Impressions, reach, clicks and CTR',
      'Spend, leads and applications',
      'Configured attribution windows',
      'Approval-based growth rules',
    ],
  },
  {
    title: 'Reservations and admissions',
    eyebrow: 'Convert demand',
    description: 'Shape every route from enquiry to confirmed place.',
    features: [
      'Enquiry and application modes',
      'Place holds and expiry',
      'Instant and paid booking',
      'Waitlists and promotion',
      'Documents, consent and approval',
    ],
  },
  {
    title: 'Offers, runs and capacity',
    eyebrow: 'Shape the offer',
    description: 'Define offers, schedules, access and capacity.',
    features: [
      'Courses, classes and memberships',
      'Runs, cohorts and seasons',
      'Sessions and recurrence',
      'Capacity and resources',
      'Access and eligibility rules',
    ],
  },
  {
    title: 'Academic operations',
    eyebrow: 'Run the programme',
    description: 'Plan programmes, cohorts, rooms and delivery.',
    features: [
      'Courses and programmes',
      'Cohorts and course runs',
      'Schedules and calendars',
      'Classrooms and facilities',
      'Multi-location planning',
    ],
  },
  {
    title: 'Students, members and participants',
    eyebrow: 'One participant record',
    description: 'Keep each participant record complete and current.',
    features: [
      'Student and participant profiles',
      'Enrolments and memberships',
      'Guardian relationships',
      'Attendance and notes',
      'Documents and progress',
    ],
  },
  {
    title: 'Organisation, brands and domains',
    eyebrow: 'Structure the business',
    description: 'Structure brands, locations, domains and responsibilities.',
    features: [
      'Organisation and brand hierarchy',
      'Locations and campuses',
      'Akademate subdomains',
      'Custom domains and themes',
      'Scoped catalogues and legal context',
    ],
  },
  {
    title: 'Teaching and staff operations',
    eyebrow: 'Coordinate the team',
    description: 'Connect every team member to their work.',
    features: [
      'Teacher and coach registry',
      'Staff profiles',
      'Assignments and schedules',
      'Role-based workspaces',
      'Workload and responsibility context',
    ],
  },
  {
    title: 'Virtual campus and learning',
    eyebrow: 'Deliver learning',
    description: 'Bring lessons, work, feedback and progress together.',
    features: [
      'Learner campus',
      'Teacher course workspace',
      'Lessons and materials',
      'Assignments and assessments',
      'Grades, feedback and progress',
    ],
  },
  {
    title: 'Communication and community',
    eyebrow: 'Keep people aligned',
    description: 'Trigger the right message from every event.',
    features: [
      'Transactional email journeys',
      'Internal teacher and learner chat',
      'Operational notifications',
      'Reminders and tasks',
      'Event-driven automation',
    ],
  },
  {
    title: 'Payments, billing and finance',
    eyebrow: 'Connect revenue',
    description: 'Keep every payment connected to its offer.',
    features: [
      'Stripe, PayPal and SEPA adapters',
      'Deposits, instalments and subscriptions',
      'Memberships and session packs',
      'Refund and cancellation policies',
      'Reconciliation and finance APIs',
    ],
  },
  {
    title: 'Finance and accounting',
    eyebrow: 'Understand the business',
    description: 'See revenue, costs, accounts and reconciliation together.',
    features: [
      'Receivables and payables',
      'Ledger and chart of accounts',
      'Cost centres and entities',
      'Bank feeds and reconciliation',
      'Accounting exports and APIs',
    ],
  },
  {
    title: 'HR and workforce',
    eyebrow: 'Support the team',
    description: 'Coordinate contracts, availability, workload and qualifications.',
    features: [
      'Contracts and staff records',
      'Availability and substitutions',
      'Workload and time',
      'Leave and qualifications',
      'Payroll inputs and teacher payments',
    ],
  },
  {
    title: 'Library, inventory and facilities',
    eyebrow: 'Manage shared resources',
    description: 'Control resources, equipment, stock and facilities.',
    features: [
      'Library catalogue and lending',
      'Digital resource access',
      'Equipment and inventory',
      'Facilities and maintenance',
      'Procurement and suppliers',
    ],
  },
  {
    title: 'Sports and seasonal operations',
    eyebrow: 'Run teams and seasons',
    description: 'Run teams, trials, seasons and temporary programmes.',
    features: [
      'Teams and categories',
      'Seasons and camps',
      'Trials and assessments',
      'Guardian consent',
      'Facilities and equipment context',
    ],
  },
  {
    title: 'Insight and reporting',
    eyebrow: 'See the operation',
    description: 'Turn demand, delivery and finance into decisions.',
    features: [
      'Operational dashboards',
      'Conversion and enrolment funnels',
      'Academic and attendance insight',
      'Finance status and reconciliation',
      'Exports and governed reporting',
    ],
  },
  {
    title: 'AI-assisted workflows',
    eyebrow: 'Optional assistance',
    description: 'Assist routine work while people keep control.',
    features: [
      'Contextual assistance',
      'Permission-aware tools',
      'Human review points',
      'Configurable providers',
      'AI transparency controls',
    ],
  },
  {
    title: 'AI workspace and MCP',
    eyebrow: 'Connect approved clients',
    description: 'Prepare academy work inside each person’s permission scope.',
    features: [
      'Tenant-scoped MCP tools',
      'Read, draft and confirm modes',
      'Compatible client options',
      'Human confirmation for consequences',
      'Auditable tool activity',
    ],
  },
  {
    title: 'Security and governance',
    eyebrow: 'Operate with trust',
    description: 'Build access, privacy and accountability into operations.',
    features: [
      'Tenant and organisation boundaries',
      'Role and permission controls',
      'Privacy workflows',
      'Retention and audit context',
      'AI governance information',
    ],
  },
  {
    title: 'APIs, webhooks and deployment',
    eyebrow: 'Fit the technology landscape',
    description: 'Connect systems through governed, adaptable interfaces.',
    features: [
      'API and webhook layer',
      'MCP integration layer',
      'Payment, email and finance providers',
      'Managed cloud service',
      'Private cloud or on-premise',
    ],
  },
] as const

export const integrationPillars = [
  {
    title: 'Payments',
    providers: ['Stripe', 'PayPal', 'SEPA'],
    text: 'Cards, wallets, direct debit and recurring collection.',
  },
  {
    title: 'Finance',
    providers: ['Invoices', 'Reconciliation', 'Finance APIs'],
    text: 'Prepare every transaction for finance workflows.',
  },
  {
    title: 'Growth',
    providers: ['Meta Ads', 'CAPI', 'MCP'],
    text: 'Connect campaign source to confirmed participation.',
  },
  {
    title: 'Communication',
    providers: ['Email', 'Webhooks', 'Messaging'],
    text: 'Trigger timely messages from operational events.',
  },
] as const

export const plans = [
  {
    name: 'Launch',
    label: 'Seasonal and cohort-ready',
    description: 'Launch polished booking and payment for one programme.',
    features: [
      'Public offer and booking journey',
      'Capacity, waitlist and deadlines',
      'Deposits or one-off payments',
      'Confirmation and reminder emails',
      'Programme closeout and exports',
    ],
    cta: 'Plan a launch',
    subject: 'launch',
  },
  {
    name: 'Business',
    label: 'Managed cloud',
    description: 'Run your complete academy in one managed service.',
    features: [
      'CRM and reservation workflows',
      'Academic and participant operations',
      'Virtual campus and teaching tools',
      'Payments, finance and automation',
      'Managed cloud operations',
    ],
    cta: 'Book a demo',
    subject: 'pricing',
  },
  {
    name: 'Enterprise',
    label: 'Dedicated or on-premise',
    description: 'Scale complex organisations on dedicated infrastructure.',
    features: [
      'Multi-brand and multi-location model',
      'Custom domains and payment responsibility',
      'Dedicated private cloud or on-premise',
      'Migration and integration programme',
      'Contracted enterprise support',
    ],
    cta: 'Talk to Enterprise',
    subject: 'partnership',
  },
] as const

export const governanceFrameworks = [
  {
    short: 'GDPR',
    title: 'Privacy operations',
    text: 'Rights, consent and privacy controls.',
  },
  {
    short: 'EU AI Act',
    title: 'AI transparency',
    text: 'Human oversight and transparent AI use.',
  },
  {
    short: 'ISO 27001',
    title: 'Security management',
    text: 'Structured information-security controls.',
  },
  {
    short: 'SOC 2',
    title: 'Trust controls',
    text: 'Security, availability and confidentiality controls.',
  },
  {
    short: 'OWASP',
    title: 'Application security',
    text: 'Modern web-application security practices.',
  },
] as const

export const academyTypes = [
  'Professional training',
  'Language academies',
  'Yoga and wellness',
  'Sports academies',
  'Seasonal camps',
  'Performing arts',
  'Online cohorts',
  'Multi-site groups',
] as const

export const clientAcademies = [
  'CEP Formación',
  'Waira Sisa Studio',
  'LinguaPro Academy',
  'SpeakEasy Institute',
  'GlobalTalk Learning Center',
  'Polyglot Hub',
  'FluentPath Academy',
  'ZenFlow Studio',
  'PranaLife Academy',
  'BalanceCore Wellness',
  'LotusMind Institute',
  'SoulStretch Yoga Hub',
  'ProSport Academy',
  'EliteTrain Institute',
  'ChampionPath Sports Hub',
  'VictoryField Academy',
  'NextGen Athletics Center',
  'HarmonyStage Academy',
  'RhythmWave Institute',
  'ArtFlow Performing Arts',
  'MelodyMakers Hub',
  'DanceSphere Academy',
  'CohortPro Academy',
  'LearnLoop Institute',
  'VirtualPath Learning Hub',
  'CourseWave Academy',
  'SkillStream Online',
  'CertifyPro Institute',
  'ComplianceAcademy Hub',
  'RegulaLearn Center',
  'ProLicense Academy',
  'AccreditaSkills Institute',
  'SummerSpark Camps',
  'SeasonPath Academy',
  'CampVibe Institute',
  'YouthTrail Camps',
  'AdventureLearn Hub',
  'MultiCampus Pro',
  'FranchiseLearn Group',
  'CampusNet Academy',
  'GlobalSites Institute',
  'BranchWise Learning Hub',
  'CodeCraft Academy',
  'DevPath Institute',
  'TechWave Learning Hub',
  'PixelMasters Academy',
  'DataFlow Tech Institute',
] as const

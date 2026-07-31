export const operatingJourney = [
  { step: '01', title: 'Discover', text: 'Turn campaigns, recommendations and course pages into one measurable intake.' },
  { step: '02', title: 'Reserve', text: 'Offer enquiry, application, instant booking, paid enrolment or a waitlist.' },
  { step: '03', title: 'Confirm', text: 'Coordinate approval, capacity, documents, consent and place expiry.' },
  { step: '04', title: 'Pay', text: 'Collect a deposit, one-off payment, subscription, instalment or membership fee.' },
  { step: '05', title: 'Deliver', text: 'Run sessions, attendance, teaching, communication and the learner campus.' },
  { step: '06', title: 'Grow', text: 'Connect conversion, participation and finance signals across the organisation.' },
] as const

export const reservationModes = [
  { title: 'Enquiry', text: 'Capture interest and route it to the right team.' },
  { title: 'Application', text: 'Review eligibility, documents or an assessment before confirming.' },
  { title: 'Place hold', text: 'Protect capacity for a defined period while requirements are completed.' },
  { title: 'Instant booking', text: 'Confirm a free or paid place immediately when the rules allow it.' },
  { title: 'Paid enrolment', text: 'Reserve, collect payment and start onboarding in one journey.' },
  { title: 'Waitlist', text: 'Keep demand organised and promote the next eligible participant.' },
] as const

export const verticals = [
  {
    slug: 'professional-training',
    title: 'Professional and regulated training',
    description: 'Applications, documentation, cohorts, academic calendars, instalments and a connected learner campus.',
    image: '/images/marketing/akademate-in-person-academy.jpg',
    imageAlt: 'Adult vocational learners working with a teacher in a modern training centre',
    capabilities: ['Admissions', 'Cohorts', 'Academic progress'],
  },
  {
    slug: 'wellness',
    title: 'Yoga, pilates and wellness studios',
    description: 'Recurring classes, room capacity, memberships, session packs and frictionless repeat booking.',
    image: '/images/marketing/akademate-wellness-studio.jpg',
    imageAlt: 'Yoga studio class coordinated by an instructor using a tablet',
    capabilities: ['Memberships', 'Session packs', 'Recurring classes'],
  },
  {
    slug: 'sports',
    title: 'Sports academies and clubs',
    description: 'Age groups, guardians, assessments, teams, seasons, attendance, licences and participant development.',
    image: '/images/marketing/akademate-sports-campus.jpg',
    imageAlt: 'Children taking part in a professionally organised outdoor sports academy',
    capabilities: ['Guardians', 'Teams', 'Seasons'],
  },
  {
    slug: 'seasonal',
    title: 'Camps and seasonal programmes',
    description: 'Launch a reservable programme with dates, capacity, deposits, documents and automated reminders.',
    image: '/images/marketing/akademate-sports-campus.jpg',
    imageAlt: 'Summer sports campus with participant check-in and coached activities',
    capabilities: ['Fast launch', 'Deposits', 'Capacity'],
  },
  {
    slug: 'performing-arts',
    title: 'Music, dance and performing arts',
    description: 'Coordinate teachers, rooms, recurring lessons, attendance, performances and family payments.',
    image: '/images/marketing/akademate-performing-arts.jpg',
    imageAlt: 'Dance and music academy operating several classes in a shared studio',
    capabilities: ['Studios', 'Teachers', 'Recurring lessons'],
  },
  {
    slug: 'online-cohorts',
    title: 'Online schools and cohort programmes',
    description: 'Bring applications, payments, lessons, assignments, chat and progress into one digital operation.',
    image: '/images/marketing/akademate-online-academy.jpg',
    imageAlt: 'Educator delivering a live online lesson from a professional teaching studio',
    capabilities: ['Virtual campus', 'Assignments', 'Community'],
  },
  {
    slug: 'languages',
    title: 'Language academies',
    description: 'Placement tests, level-based groups, attendance, monthly billing and classroom or online delivery.',
    image: '/images/marketing/akademate-in-person-academy.jpg',
    imageAlt: 'Adult learners in a collaborative language academy class',
    capabilities: ['Placement', 'Levels', 'Monthly billing'],
  },
  {
    slug: 'networks',
    title: 'Multi-site groups and franchises',
    description: 'Shared standards with local catalogues, domains, permissions, capacity and payment responsibility.',
    image: '/images/marketing/akademate-multisite-network.jpg',
    imageAlt: 'Education group leaders coordinating a multi-location training organisation',
    capabilities: ['Brands', 'Locations', 'Local finance'],
  },
] as const

export const featureGroups = [
  {
    title: 'Growth, Ads and CRM',
    eyebrow: 'Build demand',
    description: 'Connect campaigns, source context, enquiries and follow-up so teams see how interest becomes participation.',
    features: ['Lead capture and qualification', 'Campaign and UTM attribution', 'Meta Ads and conversion context', 'MCP connector layer', 'Follow-up and enrolment handoff'],
  },
  {
    title: 'Reservations and admissions',
    eyebrow: 'Convert demand',
    description: 'Configure the right route into every offer, from a simple enquiry to approval, payment and confirmed enrolment.',
    features: ['Enquiry and application modes', 'Place holds and expiry', 'Instant and paid booking', 'Waitlists and promotion', 'Documents, consent and approval'],
  },
  {
    title: 'Offers, runs and capacity',
    eyebrow: 'Shape the offer',
    description: 'Model what is sold, when it runs, who can access it and which people or resources limit capacity.',
    features: ['Courses, classes and memberships', 'Runs, cohorts and seasons', 'Sessions and recurrence', 'Capacity and resources', 'Access and eligibility rules'],
  },
  {
    title: 'Academic operations',
    eyebrow: 'Run the programme',
    description: 'Plan programmes, cohorts, schedules, rooms and delivery with the operational context kept intact.',
    features: ['Courses and programmes', 'Cohorts and course runs', 'Schedules and calendars', 'Classrooms and facilities', 'Multi-location planning'],
  },
  {
    title: 'Students, members and participants',
    eyebrow: 'One participant record',
    description: 'Keep identity, enrolment, membership, attendance, documents and progress connected over time.',
    features: ['Student and participant profiles', 'Enrolments and memberships', 'Guardian relationships', 'Attendance and notes', 'Documents and progress'],
  },
  {
    title: 'Organisation, brands and domains',
    eyebrow: 'Structure the business',
    description: 'Represent organisations, brands and locations while every public domain resolves the right experience and responsibility.',
    features: ['Organisation and brand hierarchy', 'Locations and campuses', 'Akademate subdomains', 'Custom domains and themes', 'Scoped catalogues and legal context'],
  },
  {
    title: 'Teaching and staff operations',
    eyebrow: 'Coordinate the team',
    description: 'Connect teachers, coaches and administrators to the sessions, participants and work they own.',
    features: ['Teacher and coach registry', 'Staff profiles', 'Assignments and schedules', 'Role-based workspaces', 'Workload and responsibility context'],
  },
  {
    title: 'Virtual campus and learning',
    eyebrow: 'Deliver learning',
    description: 'Give learners and teachers dedicated spaces for content, activities, progress and day-to-day collaboration.',
    features: ['Learner campus', 'Teacher course workspace', 'Lessons and materials', 'Assignments and assessments', 'Grades, feedback and progress'],
  },
  {
    title: 'Communication and community',
    eyebrow: 'Keep people aligned',
    description: 'Turn reservation, payment, teaching and attendance events into timely communication for every role.',
    features: ['Transactional email journeys', 'Internal teacher and learner chat', 'Operational notifications', 'Reminders and tasks', 'Event-driven automation'],
  },
  {
    title: 'Payments, billing and finance',
    eyebrow: 'Connect revenue',
    description: 'Keep the commercial policy, receiving entity, participant payment and finance status attached to the offer that created them.',
    features: ['Stripe, PayPal and SEPA adapters', 'Deposits, instalments and subscriptions', 'Memberships and session packs', 'Refund and cancellation policies', 'Reconciliation and finance APIs'],
  },
  {
    title: 'Sports and seasonal operations',
    eyebrow: 'Run teams and seasons',
    description: 'Support age groups, guardians, trials, teams, licences, seasonal capacity and temporary programmes.',
    features: ['Teams and categories', 'Seasons and camps', 'Trials and assessments', 'Guardian consent', 'Facilities and equipment context'],
  },
  {
    title: 'Insight and reporting',
    eyebrow: 'See the operation',
    description: 'Bring demand, conversion, delivery, participation and finance signals together for better decisions.',
    features: ['Operational dashboards', 'Conversion and enrolment funnels', 'Academic and attendance insight', 'Finance status and reconciliation', 'Exports and governed reporting'],
  },
  {
    title: 'AI-assisted workflows',
    eyebrow: 'Optional assistance',
    description: 'Use contextual assistance for summaries, communications and next actions while people remain responsible for decisions.',
    features: ['Contextual assistance', 'Permission-aware tools', 'Human review points', 'Configurable providers', 'AI transparency controls'],
  },
  {
    title: 'Security and governance',
    eyebrow: 'Operate with trust',
    description: 'Make access boundaries, privacy and accountable technology part of routine operations.',
    features: ['Tenant and organisation boundaries', 'Role and permission controls', 'Privacy workflows', 'Retention and audit context', 'AI governance information'],
  },
  {
    title: 'APIs, webhooks and deployment',
    eyebrow: 'Fit the technology landscape',
    description: 'Connect providers and systems through governed interfaces and choose the operating model that fits the organisation.',
    features: ['API and webhook layer', 'MCP integration layer', 'Payment, email and finance providers', 'Managed cloud service', 'Private cloud or on-premise'],
  },
] as const

export const integrationPillars = [
  {
    title: 'Payments',
    providers: ['Stripe', 'PayPal', 'SEPA'],
    text: 'Cards, wallets, direct debit, deposits, instalments and recurring models through configurable provider adapters.',
  },
  {
    title: 'Finance',
    providers: ['Invoices', 'Reconciliation', 'Finance APIs'],
    text: 'Keep payment context, receiving entity and finance status ready for accounting, banking and ERP workflows.',
  },
  {
    title: 'Growth',
    providers: ['Meta Ads', 'CAPI', 'MCP'],
    text: 'Carry source, campaign and conversion context from first click to reservation, enrolment and participation.',
  },
  {
    title: 'Communication',
    providers: ['Email', 'Webhooks', 'Messaging'],
    text: 'Trigger confirmations, reminders, team actions and participant journeys from operational events.',
  },
] as const

export const plans = [
  {
    name: 'Launch',
    label: 'Seasonal and cohort-ready',
    description: 'For camps, events and time-bound programmes that need a polished booking and payment operation without long setup.',
    features: ['Public offer and booking journey', 'Capacity, waitlist and deadlines', 'Deposits or one-off payments', 'Confirmation and reminder emails', 'Programme closeout and exports'],
    cta: 'Plan a launch',
    subject: 'launch',
  },
  {
    name: 'Business',
    label: 'Managed cloud',
    description: 'For growing academies that need admissions, operations, campus, communication and finance in one managed service.',
    features: ['CRM and reservation workflows', 'Academic and participant operations', 'Virtual campus and teaching tools', 'Payments, finance and automation', 'Managed cloud operations'],
    cta: 'Book a demo',
    subject: 'pricing',
  },
  {
    name: 'Enterprise',
    label: 'Dedicated or on-premise',
    description: 'For groups and networks that need organisational depth, dedicated infrastructure and an agreed integration programme.',
    features: ['Multi-brand and multi-location model', 'Custom domains and payment responsibility', 'Dedicated private cloud or on-premise', 'Migration and integration programme', 'Contracted enterprise support'],
    cta: 'Talk to Enterprise',
    subject: 'partnership',
  },
] as const

export const governanceFrameworks = [
  { short: 'GDPR', title: 'Privacy operations', text: 'Data boundaries, rights workflows and privacy-aware operations.' },
  { short: 'EU AI Act', title: 'AI transparency', text: 'Human oversight, clear AI use and accountable operational controls.' },
  { short: 'ISO 27001', title: 'Security management', text: 'A control-oriented approach to information security governance.' },
  { short: 'SOC 2', title: 'Trust controls', text: 'Operational thinking around security, availability and confidentiality.' },
  { short: 'OWASP', title: 'Application security', text: 'Secure engineering practices for modern web applications.' },
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

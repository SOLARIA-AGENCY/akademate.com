export const operatingJourney = [
  { step: '01', title: 'Attract', text: 'Bring enquiries, campaigns and conversations into one clear intake flow.' },
  { step: '02', title: 'Enrol', text: 'Move each learner from interest to the right programme, cohort and start date.' },
  { step: '03', title: 'Deliver', text: 'Coordinate courses, classrooms, teachers and online learning from one workspace.' },
  { step: '04', title: 'Engage', text: 'Keep teams and learners aligned with timely communication and visible progress.' },
  { step: '05', title: 'Grow', text: 'Turn operational signals into better planning across programmes and locations.' },
] as const

export const featureGroups = [
  {
    title: 'Admissions and CRM',
    eyebrow: 'From enquiry to enrolment',
    description: 'Give commercial and academic teams a shared view of every prospective learner and the next action that matters.',
    features: ['Lead capture and qualification', 'Campaign and source context', 'Follow-up workflows', 'Enrolment handoff', 'Contact history'],
  },
  {
    title: 'Academic operations',
    eyebrow: 'Plan the teaching day',
    description: 'Structure programmes, course editions and teaching resources without losing the operational detail behind delivery.',
    features: ['Courses and programmes', 'Cohorts and course runs', 'Schedules and calendars', 'Classrooms and resources', 'Multi-location planning'],
  },
  {
    title: 'Students and enrolments',
    eyebrow: 'One connected learner record',
    description: 'Keep the academic journey, enrolment context and day-to-day learner operations connected.',
    features: ['Student profiles', 'Enrolment records', 'Attendance workflows', 'Documents and notes', 'Progress visibility'],
  },
  {
    title: 'Organisation and campuses',
    eyebrow: 'Structure the academy',
    description: 'Model the locations, teams and operating contexts that make up the organisation while keeping responsibility clear.',
    features: ['Academy profiles', 'Campus and location records', 'Organisation branding', 'Cross-campus planning', 'Scoped operational access'],
  },
  {
    title: 'Teaching teams',
    eyebrow: 'Coordinate people and responsibility',
    description: 'Connect teachers, staff and the work they are responsible for across the academy.',
    features: ['Teacher registry', 'Staff profiles', 'Teaching assignments', 'Role-based access', 'Workload and schedule context'],
  },
  {
    title: 'Learning delivery',
    eyebrow: 'In person, online or hybrid',
    description: 'Support classroom delivery and the digital learner experience as parts of the same operation.',
    features: ['Learner campus', 'Lessons and materials', 'Course progress', 'Assessments and activities', 'Learning engagement'],
  },
  {
    title: 'Offer and publishing',
    eyebrow: 'Bring programmes to market',
    description: 'Turn the academic catalogue into clear public journeys that connect discovery, enquiry and enrolment.',
    features: ['Programme catalogue', 'Course-run publishing', 'Public course pages', 'Calls to action and forms', 'Academy website content'],
  },
  {
    title: 'Payments and finance',
    eyebrow: 'Connect learning and revenue',
    description: 'Keep commercial agreements, enrolment and payment context close to the operation that creates them.',
    features: ['Payment workflows', 'Billing context', 'Subscriptions and plans', 'Financial status visibility', 'Provider integrations'],
  },
  {
    title: 'Communication and automation',
    eyebrow: 'Keep the academy moving',
    description: 'Turn operational events into coordinated communication and repeatable team workflows.',
    features: ['Operational notifications', 'Email workflows', 'Background jobs', 'Team reminders', 'Event-driven processes'],
  },
  {
    title: 'Insight and reporting',
    eyebrow: 'See what needs attention',
    description: 'Bring academic, commercial and operational signals together so teams can act with context.',
    features: ['Operational dashboards', 'Academic reporting', 'Lead and enrolment insight', 'Progress indicators', 'Exportable views'],
  },
  {
    title: 'AI-assisted operations',
    eyebrow: 'Intelligence inside the workflow',
    description: 'Use AI to understand context, surface next actions and accelerate routine work while people remain in control.',
    features: ['Contextual assistance', 'Permission-aware tools', 'MCP connectivity', 'Human review points', 'AI transparency controls'],
  },
  {
    title: 'Security and governance',
    eyebrow: 'Operate with trust',
    description: 'Make access, privacy and responsible technology part of everyday academy operations.',
    features: ['Tenant data boundaries', 'Role and permission controls', 'Privacy workflows', 'Retention and anonymisation tools', 'AI governance information'],
  },
  {
    title: 'Integrations and deployment',
    eyebrow: 'Fit the technology landscape',
    description: 'Connect Akademate to the organisation around it and choose the infrastructure model that fits the operating requirements.',
    features: ['API access layer', 'MCP integration layer', 'Payment and email providers', 'Managed cloud deployment', 'Private cloud or on-premise'],
  },
] as const

export const plans = [
  {
    name: 'Business',
    label: 'Cloud managed',
    description: 'The connected operating system for growing academies that want to move faster without running infrastructure.',
    features: ['Academic and student operations', 'Admissions and communication workflows', 'Online and in-person delivery', 'AI-assisted workflows', 'Managed cloud operations'],
    cta: 'Book a Business demo',
    subject: 'pricing',
  },
  {
    name: 'Enterprise',
    label: 'On-premise or private cloud',
    description: 'A deployment model for organisations that need dedicated infrastructure, deeper integration and an agreed operating model.',
    features: ['Dedicated deployment', 'On-premise or private cloud', 'Advanced access architecture', 'Integration and migration programme', 'Enterprise support agreement'],
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
  'Vocational training centres',
  'Language academies',
  'Online schools',
  'Professional institutes',
  'Multi-campus groups',
] as const

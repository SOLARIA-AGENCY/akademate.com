export const operatingJourney = [
  {
    step: '01',
    title: 'Discover',
    text: 'Turn campaigns, recommendations and course pages into one measurable intake.',
  },
  {
    step: '02',
    title: 'Reserve',
    text: 'Offer enquiry, application, instant booking, paid enrolment or a waitlist.',
  },
  {
    step: '03',
    title: 'Confirm',
    text: 'Coordinate approval, capacity, documents, consent and place expiry.',
  },
  {
    step: '04',
    title: 'Pay',
    text: 'Collect a deposit, one-off payment, subscription, instalment or membership fee.',
  },
  {
    step: '05',
    title: 'Deliver',
    text: 'Run sessions, attendance, teaching, communication and the learner campus.',
  },
  {
    step: '06',
    title: 'Grow',
    text: 'Connect conversion, participation and finance signals across the organisation.',
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
    text: 'Launch a complete branded academy website with catalogue, pages, forms, SEO and booking journeys connected to the same operation.',
  },
  {
    title: 'Your own domain',
    label: 'www.youracademy.com',
    text: 'Connect an existing domain through guided DNS configuration and keep the public experience unmistakably yours.',
  },
  {
    title: 'Embeds for any website',
    label: 'Courses · Classes · Forms · Payments',
    text: 'Add live Akademate modules to the website you already use without duplicating availability, registration or payment data.',
  },
  {
    title: 'A page for every offer',
    label: 'Shareable course URL',
    text: 'Give every course, workshop, camp or event a page built to be shared, discovered, registered and paid for.',
  },
] as const

export const academyExperiences = [
  {
    id: 'operations',
    label: 'Academy team',
    eyebrow: 'For directors and centre staff',
    title: 'Run the whole academy with a clear view of today.',
    description:
      'Bring enrolment, schedules, campuses, people, attendance, communication and finance into one operational workspace.',
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
    title: 'Prepare, teach and support every learner in one place.',
    description:
      'Plan courses, run in-person or live online classes, record attendance, share work, grade submissions and continue the conversation privately.',
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
    title: 'Know what comes next and keep learning moving.',
    description:
      'Give every learner a branded virtual campus for classes, resources, assignments, grades, progress, certificates and direct teacher support.',
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

export const academySetupStages = [
  {
    id: 'blueprint',
    step: '01',
    title: 'Academy blueprint',
    description:
      'Define the operating model, teaching formats, academic calendar and launch priorities.',
    progress: 12,
    capabilities: ['Academy model', 'Teaching formats', 'Launch plan'],
  },
  {
    id: 'campuses',
    step: '02',
    title: 'Campuses and spaces',
    description:
      'Create one or many physical locations, rooms, facilities and an online campus with the right capacity.',
    progress: 30,
    capabilities: ['Multiple campuses', 'Rooms and facilities', 'Online campus'],
  },
  {
    id: 'programmes',
    step: '03',
    title: 'Programmes and offers',
    description:
      'Shape courses, cohorts, classes, memberships, events, schedules and enrolment rules.',
    progress: 48,
    capabilities: ['Courses and cohorts', 'Schedules', 'Capacity and pricing'],
  },
  {
    id: 'people',
    step: '04',
    title: 'People and access',
    description:
      'Bring in centre staff, teachers and learners with role-specific workspaces and responsibilities.',
    progress: 66,
    capabilities: ['Teams and roles', 'Teachers', 'Learners and families'],
  },
  {
    id: 'experience',
    step: '05',
    title: 'Learning and operations',
    description:
      'Connect attendance, campus, communication, payments, reporting and the tools around your academy.',
    progress: 84,
    capabilities: ['Campus and chat', 'Payments and finance', 'Integrations'],
  },
  {
    id: 'live',
    step: '06',
    title: 'Academy live',
    description:
      'Complete the readiness check and reveal a connected academy experience carrying your identity.',
    progress: 100,
    capabilities: ['Brand and website', 'Team ready', 'Launch complete'],
  },
] as const

export const platformPillars = [
  {
    title: 'Web and commerce',
    text: 'Branded websites, custom domains, embedded modules, course pages, registration and checkout.',
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
    text: 'CRM, marketing context, forms, applications, capacity, waitlists and enrolment journeys.',
    capabilities: ['Leads and CRM', 'Campaigns', 'Admissions', 'Reservations', 'Automation'],
  },
  {
    title: 'Academic operations',
    text: 'Courses, cohorts, sessions, timetables, campuses, rooms, resources and attendance.',
    capabilities: ['Courses', 'Cohorts', 'Schedules', 'Locations', 'Attendance'],
  },
  {
    title: 'People and workforce',
    text: 'Students, guardians, teachers, coaches, administrators, roles, workload and HR context.',
    capabilities: ['Student records', 'Teacher workspace', 'Roles', 'HR', 'Workload'],
  },
  {
    title: 'Campus and learning',
    text: 'Lessons, activities, live learning, assignments, grades, progress, certificates and community.',
    capabilities: ['LMS', 'Gradebook', 'Chat', 'Certificates', 'Learner analytics'],
  },
  {
    title: 'Payments and finance',
    text: 'Deposits, instalments, subscriptions, invoices, refunds, reconciliation and accounting context.',
    capabilities: ['Checkout', 'Billing', 'Receivables', 'Reconciliation', 'Accounting'],
  },
  {
    title: 'Library and resources',
    text: 'Library lending, digital resources, equipment, inventory, facilities and asset responsibility.',
    capabilities: ['Library', 'Inventory', 'Equipment', 'Facilities', 'Procurement'],
  },
  {
    title: 'Insight and ecosystem',
    text: 'Dashboards, reports, APIs, webhooks, provider integrations and optional AI-assisted workflows.',
    capabilities: ['Analytics', 'Reports', 'APIs', 'Integrations', 'AI assistance'],
  },
] as const

export const roadmapModules = [
  {
    title: 'Finance and accounting',
    phase: 'Expansion roadmap',
    text: 'Receivables, payables, ledger, cost centres, bank feeds, reconciliation, tax workflows and accounting connectors.',
  },
  {
    title: 'HR and workforce',
    phase: 'Expansion roadmap',
    text: 'Contracts, qualifications, availability, workload, time, leave, payroll inputs and teacher payments.',
  },
  {
    title: 'Library and inventory',
    phase: 'Expansion roadmap',
    text: 'Catalogues, loans, digital resources, equipment, stock, facilities, procurement and maintenance.',
  },
  {
    title: 'Advanced learning',
    phase: 'Product roadmap',
    text: 'Gradebook, rubrics, transcripts, verified certificates, learning pathways, community and moderated chat.',
  },
  {
    title: 'Mobile experience',
    phase: 'Future platform',
    text: 'A responsive PWA followed by dedicated iPhone and iPad experiences for teachers, learners and operators.',
  },
  {
    title: 'AI-assisted operations',
    phase: 'Optional capability',
    text: 'Permission-aware summaries, drafts, classifications, next actions and MCP tools with human review.',
  },
] as const

export const verticals = [
  {
    slug: 'professional-training',
    title: 'Professional and regulated training',
    description:
      'Applications, documentation, cohorts, academic calendars, instalments and a connected learner campus.',
    image: '/images/marketing/akademate-in-person-academy.jpg',
    imageAlt: 'Adult vocational learners working with a teacher in a modern training centre',
    capabilities: ['Admissions', 'Cohorts', 'Academic progress'],
  },
  {
    slug: 'wellness',
    title: 'Yoga, pilates and wellness studios',
    description:
      'Recurring classes, room capacity, memberships, session packs and frictionless repeat booking.',
    image: '/images/marketing/akademate-wellness-studio.jpg',
    imageAlt: 'Yoga studio class coordinated by an instructor using a tablet',
    capabilities: ['Memberships', 'Session packs', 'Recurring classes'],
  },
  {
    slug: 'sports',
    title: 'Sports academies and clubs',
    description:
      'Age groups, guardians, assessments, teams, seasons, attendance, licences and participant development.',
    image: '/images/marketing/akademate-sports-campus.jpg',
    imageAlt: 'Children taking part in a professionally organised outdoor sports academy',
    capabilities: ['Guardians', 'Teams', 'Seasons'],
  },
  {
    slug: 'seasonal',
    title: 'Camps and seasonal programmes',
    description:
      'Launch a reservable programme with dates, capacity, deposits, documents and automated reminders.',
    image: '/images/marketing/seasonal-campus-checkin.jpg',
    imageAlt: 'Summer sports campus with participant check-in and coached activities',
    capabilities: ['Fast launch', 'Deposits', 'Capacity'],
  },
  {
    slug: 'performing-arts',
    title: 'Music, dance and performing arts',
    description:
      'Coordinate teachers, rooms, recurring lessons, attendance, performances and family payments.',
    image: '/images/marketing/akademate-performing-arts.jpg',
    imageAlt: 'Dance and music academy operating several classes in a shared studio',
    capabilities: ['Studios', 'Teachers', 'Recurring lessons'],
  },
  {
    slug: 'online-cohorts',
    title: 'Online schools and cohort programmes',
    description:
      'Bring applications, payments, lessons, assignments, chat and progress into one digital operation.',
    image: '/images/marketing/akademate-online-academy.jpg',
    imageAlt: 'Educator delivering a live online lesson from a professional teaching studio',
    capabilities: ['Virtual campus', 'Assignments', 'Community'],
  },
  {
    slug: 'languages',
    title: 'Language academies',
    description:
      'Placement tests, level-based groups, attendance, monthly billing and classroom or online delivery.',
    image: '/images/marketing/language-academy.jpg',
    imageAlt: 'Adult learners in a collaborative language academy class',
    capabilities: ['Placement', 'Levels', 'Monthly billing'],
  },
  {
    slug: 'networks',
    title: 'Multi-site groups and franchises',
    description:
      'Shared standards with local catalogues, domains, permissions, capacity and payment responsibility.',
    image: '/images/marketing/akademate-multisite-network.jpg',
    imageAlt: 'Education group leaders coordinating a multi-location training organisation',
    capabilities: ['Brands', 'Locations', 'Local finance'],
  },
] as const

export const solutionDetails = {
  'professional-training': {
    headline: 'Fill cohorts faster. Deliver every programme with confidence.',
    promise:
      'Bring applications, documentation, schedules, teaching and learner progress into one connected professional training operation.',
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
    headline: 'More full classes. Less timetable juggling.',
    promise:
      'Connect placement, levels, recurring schedules, monthly payments and hybrid learning in a language-school experience people love.',
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
    headline: 'Create a studio experience members keep coming back to.',
    promise:
      'Make classes easy to discover, book and renew while your team stays ahead of rooms, instructors, packs and memberships.',
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
    promise:
      'Coordinate trials, teams, guardians, schedules, facilities, attendance and development from one sports academy platform.',
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
    headline: 'Launch your next camp in days, not weeks.',
    promise:
      'Create a polished programme page, take deposits, manage capacity and keep every family informed from booking to the final day.',
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
    headline: 'Keep every class, studio and performance in rhythm.',
    promise:
      'Connect recurring lessons, teachers, rooms, attendance, family payments and performance preparation in one creative operation.',
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
    headline: 'Turn every cohort into a learning community.',
    promise:
      'Bring applications, payments, live sessions, content, assignments, conversation and progress into one branded online academy.',
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
    headline: 'One brand experience. Every location in control.',
    promise:
      'Scale shared programmes, standards and insight while each location keeps the catalogue, permissions and payment responsibility it needs.',
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
    description:
      'Launch a complete academy website, connect your own domain or place live Akademate modules inside the site you already use.',
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
    description:
      'Connect campaigns, source context, enquiries and follow-up so teams see how interest becomes participation.',
    features: [
      'Lead capture and qualification',
      'Campaign and UTM attribution',
      'Meta Ads and conversion context',
      'MCP connector layer',
      'Follow-up and enrolment handoff',
    ],
  },
  {
    title: 'Reservations and admissions',
    eyebrow: 'Convert demand',
    description:
      'Configure the right route into every offer, from a simple enquiry to approval, payment and confirmed enrolment.',
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
    description:
      'Model what is sold, when it runs, who can access it and which people or resources limit capacity.',
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
    description:
      'Plan programmes, cohorts, schedules, rooms and delivery with the operational context kept intact.',
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
    description:
      'Keep identity, enrolment, membership, attendance, documents and progress connected over time.',
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
    description:
      'Represent organisations, brands and locations while every public domain resolves the right experience and responsibility.',
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
    description:
      'Connect teachers, coaches and administrators to the sessions, participants and work they own.',
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
    description:
      'Give learners and teachers dedicated spaces for content, activities, progress and day-to-day collaboration.',
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
    description:
      'Turn reservation, payment, teaching and attendance events into timely communication for every role.',
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
    description:
      'Keep the commercial policy, receiving entity, participant payment and finance status attached to the offer that created them.',
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
    description:
      'Bring academy revenue, expenses, accounts and reconciliation into the same operational context as programmes and participants.',
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
    description:
      'Coordinate the people behind delivery with contracts, availability, workload, qualifications and payroll-ready context.',
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
    description:
      'Keep learning resources, equipment, stock, rooms and facilities available to the programmes and people that need them.',
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
    description:
      'Support age groups, guardians, trials, teams, licences, seasonal capacity and temporary programmes.',
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
    description:
      'Bring demand, conversion, delivery, participation and finance signals together for better decisions.',
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
    description:
      'Use contextual assistance for summaries, communications and next actions while people remain responsible for decisions.',
    features: [
      'Contextual assistance',
      'Permission-aware tools',
      'Human review points',
      'Configurable providers',
      'AI transparency controls',
    ],
  },
  {
    title: 'Security and governance',
    eyebrow: 'Operate with trust',
    description:
      'Make access boundaries, privacy and accountable technology part of routine operations.',
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
    description:
      'Connect providers and systems through governed interfaces and choose the operating model that fits the organisation.',
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
    description:
      'For camps, events and time-bound programmes that need a polished booking and payment operation without long setup.',
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
    description:
      'For growing academies that need admissions, operations, campus, communication and finance in one managed service.',
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
    description:
      'For groups and networks that need organisational depth, dedicated infrastructure and an agreed integration programme.',
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
    text: 'Data boundaries, rights workflows and privacy-aware operations.',
  },
  {
    short: 'EU AI Act',
    title: 'AI transparency',
    text: 'Human oversight, clear AI use and accountable operational controls.',
  },
  {
    short: 'ISO 27001',
    title: 'Security management',
    text: 'A control-oriented approach to information security governance.',
  },
  {
    short: 'SOC 2',
    title: 'Trust controls',
    text: 'Operational thinking around security, availability and confidentiality.',
  },
  {
    short: 'OWASP',
    title: 'Application security',
    text: 'Secure engineering practices for modern web applications.',
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

import { verticals } from './marketing-content'

export type VerticalSlug = (typeof verticals)[number]['slug']

export type VerticalFaq = { question: string; answer: string }

export type VerticalLandingCopy = {
  seoTitle: string
  metaDescription: string
  faqHeading: string
  integrationNote: string
  faqs: readonly VerticalFaq[]
}

export type VerticalProofQuote = { quote: string; author: string }

// SEO title, meta description, integration note and FAQ set per vertical.
// FAQ answers only claim capabilities that exist in the platform canon
// (web/commerce, CRM + reservations, academic operations, campus, checkout/billing,
// multi-brand, analytics/integrations). Roadmap items (QR/NFC access, digital
// signage, fee automation) are deliberately absent.
export const verticalLandingContent: Record<VerticalSlug, VerticalLandingCopy> = {
  'professional-training': {
    seoTitle: 'Training Center Software | Akademate',
    metaDescription:
      'Training center software for regulated programs: admissions, cohorts, attendance and certificates with payments built in. Book a demo with Akademate.',
    faqHeading: 'Training center software: your questions, answered',
    integrationNote:
      'Collect matrícula and installments with Stripe, PayPal or SEPA, and feed enrolments from Meta Ads straight into your CRM.',
    faqs: [
      {
        question: 'Can we keep our current virtual campus (LMS)?',
        answer:
          'Yes. Akademate’s virtual campus covers sessions, feedback and progress, and it is designed to sit next to the tools you already run, while admissions, records and payments stay connected.',
      },
      {
        question: 'Does it handle convocatorias, places and installment payments?',
        answer:
          'Courses, cohorts, schedules and locations give each intake its own places and calendar, and checkout supports deposits or one-off payments with confirmation and reminder emails.',
      },
      {
        question: 'Is student data GDPR-compliant?',
        answer:
          'Akademate is built for academy data: role-based access per team, records isolated per academy, and managed cloud or dedicated infrastructure when you need it.',
      },
      {
        question: 'We run several sites with different programmes. One account?',
        answer:
          'Multi-brand and multi-location is part of the model: shared standards, per-site workspaces and roles, plus reporting across the whole group.',
      },
      {
        question: 'How do attendance rules work?',
        answer:
          'Attendance is part of academic operations: rosters per session, records per student and analytics that surface patterns before they become problems.',
      },
    ],
  },
  wellness: {
    seoTitle: 'Yoga & Pilates Studio Software | Akademate',
    metaDescription:
      'Yoga studio software that fills every class: bookings, waitlists, memberships and payments on your own web presence. Book a demo with Akademate.',
    faqHeading: 'Yoga studio software: your questions, answered',
    integrationNote:
      'Recurring memberships and packs collect through Stripe, PayPal or SEPA; Meta Ads and CAPI connect your campaigns to booked classes.',
    faqs: [
      {
        question: 'Can my clients book without downloading an app?',
        answer:
          'Yes. Booking runs on your own web presence: your site, your schedule, your checkout. No marketplace app sits between you and your members.',
      },
      {
        question: 'How does the waitlist work?',
        answer:
          'Reservations include capacity and waitlists with deadlines, so a cancelled spot moves on and your classes stay full.',
      },
      {
        question: 'How do you handle no-shows and late cancellations?',
        answer:
          'Booking windows, capacity rules and automated reminder emails keep attendance honest; the cancellation policy is yours to set per class.',
      },
      {
        question: 'Does it support memberships and class packs?',
        answer:
          'Both: recurring billing for memberships, packs and one-off payments through checkout, with receivables and reconciliation in the same platform.',
      },
      {
        question: 'Can we manage more than one studio?',
        answer:
          'Yes. Multi-location workspaces with per-site roles and network reporting cover studios that grow beyond one room.',
      },
    ],
  },
  sports: {
    seoTitle: 'Sports Academy Software | Akademate',
    metaDescription:
      'Sports academy software for trials, teams, seasons and guardians: admissions, scheduling, attendance and payments in one platform. Book a demo.',
    faqHeading: 'Sports academy software: your questions, answered',
    integrationNote:
      'Monthly fees and kits collect with Stripe, PayPal or SEPA, while Meta Ads and CAPI turn local demand into booked trials.',
    faqs: [
      {
        question: 'How do trial sessions become enrolled athletes?',
        answer:
          'Trials run through the same CRM and reservations flow: a family books a trial, your team follows up, and the trial becomes a confirmed place with billing attached.',
      },
      {
        question: 'Can guardians follow their athletes?',
        answer:
          'Communication tools keep guardians close to sessions and season news, with roles that separate staff, coaches and families.',
      },
      {
        question: 'Do you support teams, facilities and seasons?',
        answer:
          'Courses, cohorts, schedules and locations model teams, training slots and facilities, with seasons and age groups mapped as cohorts.',
      },
      {
        question: 'How does billing work?',
        answer:
          'Recurring billing and one-off payments cover monthly fees, registration and kits, and receivables show who owes what at any time.',
      },
      {
        question: 'We train in several venues. One account?',
        answer:
          'Yes. Multi-location workspaces with per-site roles and network reporting keep every venue aligned.',
      },
    ],
  },
  languages: {
    seoTitle: 'Language Academy Software | Akademate',
    metaDescription:
      'Language academy software for placement, levels and monthly billing, in person and online. Fill every level and keep collection on track. Book a demo.',
    faqHeading: 'Language academy software: your questions, answered',
    integrationNote:
      'Monthly billing collects through Stripe, PayPal or SEPA; Meta Ads and CAPI feed your campaigns straight into the CRM.',
    faqs: [
      {
        question: 'How does level placement work?',
        answer:
          'Placement is a step in admissions: capture the enquiry, run placement and assign the right level group from the same record.',
      },
      {
        question: 'Can we bill monthly automatically?',
        answer:
          'Recurring billing handles monthly course fees, and receivables with reminders keep collection on track.',
      },
      {
        question: 'Can we run online and in-person groups together?',
        answer:
          'The virtual campus sits next to schedules and locations, so hybrid groups share one record and one view of progress.',
      },
      {
        question: 'What happens when a group is full?',
        answer:
          'Capacity and waitlists per group: when demand is there, you see it and open the next group with confidence.',
      },
      {
        question: 'Can teachers see only their own groups?',
        answer:
          'The teacher workspace gives each teacher their schedule, rosters and progress without exposing the rest of the academy.',
      },
    ],
  },
  'driving-schools': {
    seoTitle: 'Driving School Software | Akademate',
    metaDescription:
      'Driving school software that fills the diary: lessons, vehicles, exams and payments in one student record. Book a demo with Akademate.',
    faqHeading: 'Driving school software: your questions, answered',
    integrationNote:
      'Packs and deposits collect with Stripe, PayPal or SEPA; Meta Ads and CAPI turn local searches into booked lessons.',
    faqs: [
      {
        question: 'Can students book their own lessons without calling the school?',
        answer:
          'Yes. Public offer pages with booking and capacity let students reserve from their phone, and reminders go out automatically.',
      },
      {
        question: 'How does the diary prevent double-booked instructors and cars?',
        answer:
          'Schedules and reservations treat instructors, vehicles and slots as capacity, so a slot can only be booked once and the calendar stays honest.',
      },
      {
        question: 'Does it track exam dates and retakes?',
        answer:
          'Exam dates, progress and payments live on one student record, so every retake and convocatoria is visible next to the lessons that prepare it.',
      },
      {
        question: 'Can we charge deposits and keep payment plans under control?',
        answer:
          'Checkout supports deposits or one-off payments, recurring billing covers monthly plans, and receivables show exactly who owes what.',
      },
      {
        question: 'We run two sites. One account?',
        answer:
          'Yes. Multi-location workspaces with per-site roles and network reporting keep both sites on one record per student.',
      },
    ],
  },
  seasonal: {
    seoTitle: 'Summer Camp Software | Akademate',
    metaDescription:
      'Camp software to launch, fill and run your season: offer pages, capacity, waitlists, deposits and family communication. Book a demo with Akademate.',
    faqHeading: 'Camp software: your questions, answered',
    integrationNote:
      'Deposits and one-off payments collect with Stripe, PayPal or SEPA; Meta Ads and CAPI fill your funnel early.',
    faqs: [
      {
        question: 'How fast can we publish a camp?',
        answer:
          'Launch is built for it: a public offer page with dates, capacity and deadlines goes live in days, with confirmation and reminder emails included.',
      },
      {
        question: 'Can we take deposits?',
        answer:
          'Yes. Checkout supports deposits or one-off payments, so families hold their place without paying the full season upfront.',
      },
      {
        question: 'What happens when a week fills up?',
        answer:
          'Capacity and waitlists per week: families join the waitlist and you see demand clearly enough to open another group.',
      },
      {
        question: 'How do we keep parents informed?',
        answer:
          'Communication tools send arrival information and reminders from operational events, per programme and per family.',
      },
      {
        question: 'Can we manage weeks, ages and groups?',
        answer: 'Cohorts, schedules and locations model weeks, age groups and rooms in one calendar.',
      },
    ],
  },
  'coding-academies': {
    seoTitle: 'Coding Academy Software | Akademate',
    metaDescription:
      'Coding academy software for cohorts, projects and mentors: admissions, campus, progress and payments from application to job-ready. Book a demo.',
    faqHeading: 'Coding academy software: your questions, answered',
    integrationNote:
      'Deposits and installment plans collect with Stripe, PayPal or SEPA; Meta Ads and CAPI feed applications into your CRM.',
    faqs: [
      {
        question: 'How do cohort applications work?',
        answer:
          'Admissions runs from interest to confirmed seat: applications, interviews and deposits in one pipeline per cohort.',
      },
      {
        question: 'Can students keep projects in one place?',
        answer:
          'The virtual campus holds assignments, projects and feedback, so every cohort has one home instead of five tools.',
      },
      {
        question: 'What do mentors see?',
        answer:
          'Each mentor gets a clear view of their students: progress, submissions and attendance, without the rest of the school in the way.',
      },
      {
        question: 'Can we show job-ready portfolios?',
        answer:
          'Project work and completion live on the student record, ready to share with hiring partners when the cohort finishes.',
      },
      {
        question: 'Can we charge per cohort or in installments?',
        answer:
          'Both: deposits, one-off payments and recurring billing cover upfront and installment models with receivables attached.',
      },
    ],
  },
  'performing-arts': {
    seoTitle: 'Music & Dance Studio Software | Akademate',
    metaDescription:
      'Studio software for music, dance and performing arts: recurring lessons, family accounts, performances and payments in one place. Book a demo.',
    faqHeading: 'Music studio software: your questions, answered',
    integrationNote:
      'Monthly fees and recital charges collect with Stripe, PayPal or SEPA; Meta Ads and CAPI fill your classes.',
    faqs: [
      {
        question: 'How do recurring lessons work?',
        answer:
          'Recurring schedules per teacher, studio and discipline keep every lesson booked, and families see their slot without calling you.',
      },
      {
        question: 'Can families manage several children?',
        answer: 'Family accounts keep siblings, schedules and payments under one roof.',
      },
      {
        question: 'Can we plan performances?',
        answer:
          'Events and progress tracking let you plan productions from one view, with cast and families informed from the same record.',
      },
      {
        question: 'How do we track progress per student?',
        answer: 'Progress and attendance live on each student record, visible to teachers and families.',
      },
      {
        question: 'Can we bill monthly?',
        answer: 'Recurring billing and receivables keep monthly fees collected without chasing anyone.',
      },
    ],
  },
  'online-cohorts': {
    seoTitle: 'Cohort Course Software | Akademate',
    metaDescription:
      'Cohort course software for online schools: admissions, virtual campus, community and progress from application to completion. Book a demo.',
    faqHeading: 'Cohort course software: your questions, answered',
    integrationNote:
      'Deposits and installments collect with Stripe, PayPal or SEPA; Meta Ads and CAPI feed your application funnel.',
    faqs: [
      {
        question: 'How do we admit a cohort?',
        answer:
          'Admissions per cohort: application, deposit and confirmation, with places and deadlines enforced by the platform.',
      },
      {
        question: 'Where do students learn?',
        answer: 'One virtual campus: assignments, chat, progress and community in a single home for each cohort.',
      },
      {
        question: 'How does community stay active between sessions?',
        answer:
          'Chat and community tools keep cohorts talking between live sessions, on the same record as their learning.',
      },
      {
        question: 'Can we see who is falling behind?',
        answer: 'Learner analytics surface progress and completion early enough to act, per student and per cohort.',
      },
      {
        question: 'How do payments work?',
        answer:
          'Deposits, one-off payments or installments at checkout, with receivables and reconciliation in the same platform.',
      },
    ],
  },
  networks: {
    seoTitle: 'Multi-Site Academy Software | Akademate',
    metaDescription:
      'Multi-site academy software for groups and franchises: shared standards, per-site control, custom domains and network reporting. Talk to Enterprise.',
    faqHeading: 'Multi-site academy software: your questions, answered',
    integrationNote:
      'Each location keeps its own payment responsibility; Stripe, PayPal and SEPA stay connected across the network.',
    faqs: [
      {
        question: 'Can each site keep its own domain and billing?',
        answer:
          'Yes. The multi-brand and multi-location model supports custom domains and separate payment responsibility per site.',
      },
      {
        question: 'How do we keep standards consistent?',
        answer:
          'Standards are defined centrally and every site operates locally within them, so quality scales without micromanagement.',
      },
      {
        question: 'Who sees what?',
        answer:
          'Roles separate central leadership from local teams: per-site workspaces for daily work, network reporting for the group.',
      },
      {
        question: 'Can we compare sites?',
        answer: 'Network reporting puts performance across locations in one view, from enrolment to collection.',
      },
      {
        question: 'Can it run on private infrastructure?',
        answer:
          'Enterprise runs on managed cloud, dedicated private cloud or on-premise, with a migration and integration programme.',
      },
    ],
  },
}

// Nominative learner quotes already published on the akademate.com home,
// attributed to the live academy at cepformacion.akademate.com. Only the
// verticals with real quoted proof appear here; no invented testimonials.
export const verticalProofQuotes: Partial<Record<VerticalSlug, readonly VerticalProofQuote[]>> = {
  'professional-training': [
    { quote: 'The service is excellent.', author: 'Olga Mercedes' },
    { quote: 'I recommend it 100%.', author: 'Isabel Clemente' },
    { quote: 'The best academy on the island.', author: 'Mr. Avocato' },
  ],
}

// Add-on chips shown on each vertical landing (ids reference paidExtensions
// in lib/pricing-content.ts; ids are locale-neutral so no ES mirror is needed).
export const verticalAddonChips: Record<VerticalSlug, readonly string[]> = {
  'professional-training': ['access', 'agentic'],
  wellness: ['signage', 'agentic'],
  sports: ['access', 'signage'],
  languages: ['growth', 'agentic'],
  'driving-schools': ['access', 'growth'],
  seasonal: ['access', 'signage'],
  'coding-academies': ['growth', 'agentic'],
  'performing-arts': ['growth', 'signage'],
  'online-cohorts': ['agentic', 'growth'],
  networks: ['access', 'finance'],
}

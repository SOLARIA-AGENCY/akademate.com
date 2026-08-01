export type BlogSection = {
  title: string
  paragraphs: readonly string[]
  points?: readonly string[]
}

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  displayDate: string
  readingTime: string
  image: string
  imageAlt: string
  introduction: string
  sections: readonly BlogSection[]
}

export const blogPosts: readonly BlogPost[] = [
  {
    slug: 'campaign-click-to-confirmed-place',
    title: 'From campaign click to confirmed place',
    excerpt:
      'The best academy booking experiences turn curiosity into confidence while keeping capacity, payments and follow-up beautifully organised.',
    category: 'Growth playbook',
    date: '2026-07-31',
    displayDate: '31 July 2026',
    readingTime: '8 min read',
    image: '/images/marketing/blog-reservation-journey.jpg',
    imageAlt: 'Prospective learner choosing and booking a professional programme online',
    introduction:
      'A learner rarely experiences your funnel as a funnel. They see a promise, imagine a future and decide whether the next step feels clear enough to take. Great academy operations connect that emotional moment to a booking journey that is fast, reassuring and easy to complete.',
    sections: [
      {
        title: 'Make the next step match the decision',
        paragraphs: [
          'Not every programme should ask for the same commitment. A short class may need instant booking, professional training may need an application and a seasonal camp may begin with a deposit and guardian consent.',
          'The strongest journey gives each offer the right path without forcing the team to rebuild forms, emails and spreadsheets every time.',
        ],
      },
      {
        title: 'Let capacity create confidence',
        paragraphs: [
          'Availability should feel clear to the participant and actionable to the academy. Place holds, deadlines and waitlists turn uncertainty into a guided decision rather than a string of manual follow-ups.',
          'When capacity is connected to the programme run, the team can act on real demand and open the next cohort at the right moment.',
        ],
        points: [
          'Show the right availability',
          'Protect a place while requirements are completed',
          'Promote eligible people from the waitlist',
          'Open new capacity around real demand',
        ],
      },
      {
        title: 'Bring payment into the experience',
        paragraphs: [
          'Deposits, instalments, memberships and one-off payments are part of how a learner decides and how an academy builds trust.',
          'A connected payment journey keeps the offer, receiving account, confirmation and finance status together from the start.',
        ],
      },
      {
        title: 'Measure the journey that matters',
        paragraphs: [
          'Campaign clicks are useful, but confirmed places are what make a programme viable. Connect source, enquiry, reservation, payment and attendance to understand which activity creates lasting participation.',
          'That visibility helps growth and operations teams make the same decision from the same story.',
        ],
      },
    ],
  },
  {
    slug: 'akademate-expands-sport-wellness-seasonal',
    title: 'Akademate for sport, wellness and camps',
    excerpt:
      'New operating profiles bring memberships, teams, guardians, session packs, trials, seasons and camps into the Akademate platform vision.',
    category: 'Product news',
    date: '2026-07-31',
    displayDate: '31 July 2026',
    readingTime: '6 min read',
    image: '/images/marketing/blog-vertical-expansion.jpg',
    imageAlt: 'Sports coaches and wellness instructors planning programmes together',
    introduction:
      'Learning businesses are more diverse than a traditional course catalogue. A yoga studio, youth sports academy and summer camp may use different language, but all need a compelling way to attract people, manage capacity, deliver an experience and build lasting relationships.',
    sections: [
      {
        title: 'One platform, different operating rhythms',
        paragraphs: [
          'Wellness studios think in classes, instructors, rooms, packs and memberships. Sports academies add trials, teams, age groups, guardians and seasons. Camps concentrate demand, documents and payments into a short launch window.',
          'Akademate profiles these differences as configurable capabilities so each organisation can feel purpose-built without becoming an isolated product.',
        ],
      },
      {
        title: 'Booking becomes part of the programme',
        paragraphs: [
          'A recurring yoga class needs fast repeat booking. A sports trial may lead to assessment and team placement. A camp needs week selection, capacity, deposits and guardian information.',
          'The reservation journey now sits at the centre of how these models are presented across Akademate.',
        ],
        points: [
          'Memberships and session packs',
          'Trials, assessments and teams',
          'Guardian relationships and consent',
          'Seasonal capacity and deposits',
        ],
      },
      {
        title: 'A richer participant experience',
        paragraphs: [
          'The participant record can represent a learner, member, athlete, player or attendee while keeping attendance, communication and progress connected.',
          'Teachers, instructors and coaches receive workspaces aligned to the sessions and people they support.',
        ],
      },
      {
        title: 'Built to grow beyond one location',
        paragraphs: [
          'The same profiles can scale into groups and franchises with shared standards, local schedules, custom domains and clear payment responsibility.',
          'This creates a path from one studio or programme to a connected network without losing the experience that made the original operation successful.',
        ],
      },
    ],
  },
  {
    slug: 'ai-assisted-academy-operations',
    title: 'AI-assisted operations for academy teams',
    excerpt:
      'The most useful AI in education does not replace educators. It removes operational friction around the work only people can do.',
    category: 'AI operations',
    date: '2026-07-29',
    displayDate: '29 July 2026',
    readingTime: '7 min read',
    image: '/images/marketing/blog-ai-assisted-operations.jpg',
    imageAlt: 'Academy operations team coordinating schedules and next actions around a table',
    introduction:
      'Academies rarely struggle because their teams lack commitment. They struggle because crucial context is scattered across inboxes, spreadsheets, calendars and disconnected systems. AI becomes valuable when it works inside that operational reality: finding the right context, preparing the next step and leaving the decision with the person responsible.',
    sections: [
      {
        title: 'Start with the operating system, not the chatbot',
        paragraphs: [
          'A standalone assistant can produce text, but it cannot reliably understand which learner belongs to which cohort, whether a room is available or who is allowed to approve a change. Useful assistance begins with a connected operational model: students, programmes, schedules, staff, communications and permissions.',
          'When that structure exists, AI can help a coordinator review what changed, identify incomplete work and prepare an action in the right context. The interface becomes less about asking a blank chat box a clever question and more about receiving timely support where the work already happens.',
        ],
      },
      {
        title: 'Focus AI on high-friction, reversible work',
        paragraphs: [
          'The first opportunities are usually repetitive and easy to review: summarising an enquiry, drafting a follow-up, grouping unresolved items, preparing a weekly overview or explaining why a schedule needs attention. These tasks consume time without benefiting from unnecessary manual repetition.',
          'A good operating model distinguishes between preparing an action and executing it. The system can assemble context and suggest a response; a team member can inspect, adjust and approve it. That boundary creates speed without turning educational or financial decisions into invisible automation.',
        ],
        points: [
          'Surface the next operational action',
          'Prepare communications with the right context',
          'Summarise activity across a programme or cohort',
          'Keep a human approval point for meaningful changes',
        ],
      },
      {
        title: 'Permissions are part of the product experience',
        paragraphs: [
          'An academy director, teacher and admissions coordinator should not see or change the same information. AI assistance must inherit those boundaries. If a person cannot access a financial record or another campus, an assistant acting for that person should not gain a shortcut around the rule.',
          'This is why permission-aware tools matter more than a long list of model providers. Trust comes from predictable scope: the right organisation, the right role, the right resource and a visible record of what happened.',
        ],
      },
      {
        title: 'Measure recovered attention, not generated words',
        paragraphs: [
          'The outcome to optimise is not how much content an AI produces. It is how much fragmented work disappears from the team’s day. Useful measures include response preparation time, unresolved operational items, duplicate data entry and the time needed to understand the state of a programme.',
          'AI-assisted operations should make the academy calmer. Teams spend less time reconstructing context and more time supporting learners, improving programmes and making considered decisions.',
        ],
      },
    ],
  },
  {
    slug: 'one-operation-in-person-online-academies',
    title: 'One academy, classroom and online',
    excerpt:
      'Physical and digital delivery should feel like two teaching environments supported by one coherent operation.',
    category: 'Academy operations',
    date: '2026-07-29',
    displayDate: '29 July 2026',
    readingTime: '6 min read',
    image: '/images/marketing/blog-hybrid-academy.jpg',
    imageAlt: 'Connected adult classroom and online teaching studio inside the same academy',
    introduction:
      'Learners may join from a classroom, from home or through a mixture of both. The operational challenge is not choosing one mode. It is keeping programmes, people, schedules and learner progress coherent as delivery moves between them.',
    sections: [
      {
        title: 'Separate learning environments create duplicated work',
        paragraphs: [
          'When classroom planning and online delivery live in different systems, teams repeat the same setup. Learner records diverge, teachers receive partial information and managers assemble reports manually. The technology reflects channels instead of reflecting the academy.',
          'A connected operating system treats the programme as the stable object. Delivery mode, room, digital lesson and teaching resource become parts of that programme rather than separate administrative worlds.',
        ],
      },
      {
        title: 'Build around the learner journey',
        paragraphs: [
          'The learner journey starts before the first lesson. Enquiries, enrolment, scheduling, attendance, communication and progress all need continuity. A change in delivery mode should not force the academy to recreate that journey or lose its history.',
          'This makes handoffs clearer. Admissions knows which cohort is appropriate, teaching teams see the right learner context and operations can coordinate the room or online session without rebuilding the underlying record.',
        ],
        points: [
          'One programme and cohort structure',
          'Shared learner and enrolment context',
          'Schedules that cover rooms and online sessions',
          'Progress visible across the delivery journey',
        ],
      },
      {
        title: 'Give teachers one reliable working context',
        paragraphs: [
          'Teachers need a concise view of who they are teaching, what has already happened and what comes next. They should not have to reconcile a classroom list, a video platform and an administrative spreadsheet before every session.',
          'The best interface is not the one with the most information. It is the one that presents the relevant cohort, materials, attendance and progress at the moment the teacher needs them.',
        ],
      },
      {
        title: 'Operate the academy as one connected business',
        paragraphs: [
          'For managers, a unified operation makes capacity and demand easier to understand. A physical room, an online group and a hybrid cohort can be planned within the same view of programmes, teachers and enrolments.',
          'That coherence supports better decisions about where to open a new cohort, how to allocate teaching time and which learner journeys need attention. The academy can adapt its delivery without fragmenting its operation.',
        ],
      },
    ],
  },
] as const

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

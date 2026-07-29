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
    slug: 'ai-assisted-academy-operations',
    title: 'AI-assisted operations: giving academy teams their time back',
    excerpt: 'The most useful AI in education does not replace educators. It removes operational friction around the work only people can do.',
    category: 'AI operations',
    date: '2026-07-29',
    displayDate: '29 July 2026',
    readingTime: '7 min read',
    image: '/images/marketing/blog-ai-assisted-operations.jpg',
    imageAlt: 'Academy operations team coordinating schedules and next actions around a table',
    introduction: 'Academies rarely struggle because their teams lack commitment. They struggle because crucial context is scattered across inboxes, spreadsheets, calendars and disconnected systems. AI becomes valuable when it works inside that operational reality: finding the right context, preparing the next step and leaving the decision with the person responsible.',
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
        points: ['Surface the next operational action', 'Prepare communications with the right context', 'Summarise activity across a programme or cohort', 'Keep a human approval point for meaningful changes'],
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
    title: 'One academy operation across classrooms and online learning',
    excerpt: 'Physical and digital delivery should feel like two teaching environments supported by one coherent operation.',
    category: 'Academy operations',
    date: '2026-07-29',
    displayDate: '29 July 2026',
    readingTime: '6 min read',
    image: '/images/marketing/blog-hybrid-academy.jpg',
    imageAlt: 'Connected adult classroom and online teaching studio inside the same academy',
    introduction: 'Learners may join from a classroom, from home or through a mixture of both. The operational challenge is not choosing one mode. It is keeping programmes, people, schedules and learner progress coherent as delivery moves between them.',
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
        points: ['One programme and cohort structure', 'Shared learner and enrolment context', 'Schedules that cover rooms and online sessions', 'Progress visible across the delivery journey'],
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

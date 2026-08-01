export type BlogSection = {
  title: string
  paragraphs: readonly string[]
  points?: readonly string[]
}

export type BlogPost = {
  kind: 'insight' | 'news'
  slug: string
  title: string
  seoTitle: string
  excerpt: string
  category: string
  keywords: readonly string[]
  author: string
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
    kind: 'insight',
    slug: 'campaign-click-to-confirmed-place',
    title: 'From click to confirmed place',
    seoTitle: 'Academy enrolment funnel: campaign click to confirmed place',
    excerpt: 'Convert interest into bookings and organised follow-up.',
    category: 'Growth playbook',
    keywords: ['academy enrolment funnel', 'course booking', 'academy CRM', 'lead conversion'],
    author: 'Akademate Editorial Team',
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
      {
        title: 'Design follow-up around intent',
        paragraphs: [
          'A person who downloaded a guide, someone who requested a call and a learner who started payment are expressing different levels of intent. Effective academy follow-up reflects that difference. The message, timing and owner should match what the prospective learner has already done and what is still preventing a decision.',
          'This context helps teams replace generic reminders with useful guidance. Admissions can answer the relevant question, explain the next requirement or protect a place for an agreed period. Marketing can see which sources create qualified conversations instead of optimising only for inexpensive clicks.',
        ],
      },
      {
        title: 'Create one accountable enrolment record',
        paragraphs: [
          'The operational record should preserve source, consent, communication, booking state, documents and payment without forcing staff to reconcile several systems. A shared timeline makes ownership visible and reduces the risk that two people contact the same learner with conflicting information.',
          'The result is a more coherent experience for the learner and a more measurable process for the academy. Teams can identify where decisions slow down, improve the offer page or registration flow and compare programme performance using confirmed participation rather than isolated channel metrics.',
        ],
      },
      {
        title: 'Review the journey as one operating team',
        paragraphs: [
          'Growth, admissions, teaching and finance see different parts of enrolment, but the learner experiences one academy. A regular review should connect campaign quality, unanswered questions, incomplete requirements, payment friction and first-session attendance instead of treating each metric as an isolated department report.',
          'This shared review creates practical improvements. The academy can clarify an offer, remove an unnecessary field, change a deposit rule or prepare teachers for the questions new learners raise most often. Small operational changes compound when every team is working from the same enrolment evidence.',
        ],
      },
    ],
  },
  {
    kind: 'news',
    slug: 'akademate-expands-sport-wellness-seasonal',
    title: 'Sport, wellness and camps',
    seoTitle: 'Akademate expands for sports, wellness studios and camps',
    excerpt: 'Memberships, seasons, camps and teams.',
    category: 'Product news',
    keywords: ['sports academy software', 'yoga studio software', 'camp management platform'],
    author: 'Akademate Product Team',
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
      {
        title: 'Operations shaped around each vertical',
        paragraphs: [
          'The new profiles organise the language and workflow around the organisation. A wellness operator can work with sessions, passes and instructors. A sports academy can manage trials, teams and guardians. A camp can coordinate dates, activities, documents and a sharply defined capacity window.',
          'These differences appear in public offer pages, registration questions and staff workspaces while the underlying operating model remains connected. That balance supports a tailored experience without creating separate data silos for every programme type.',
        ],
      },
      {
        title: 'What the expansion enables next',
        paragraphs: [
          'This release direction establishes a foundation for richer attendance, membership renewal, seasonal closeout and multi-location reporting. It also gives academies a clearer way to present specialised offers without hiding them inside a generic course catalogue.',
          'Akademate will continue validating these workflows with operators before presenting roadmap capabilities as generally available. The aim is a dependable operating system that adapts to the academy model while keeping payment, communication, learning and reporting connected.',
        ],
      },
      {
        title: 'A clearer public experience for every programme',
        paragraphs: [
          'Each vertical can present the information people need before they commit. A studio may foreground instructor, level and pass options. A sports academy can explain trials, age groups and guardian requirements. A camp can make dates, activities, capacity and payment milestones immediately understandable.',
          'These offer pages connect discovery to the appropriate registration path without asking the operator to rebuild the journey for every programme. The public experience remains recognisably theirs while operational data reaches the schedules, participant records and payment context used by the team.',
          'Operators can then compare interest, confirmed attendance and renewal patterns using language that matches the programme. This makes reporting easier to interpret and gives teams a stronger basis for deciding which timetable, membership or seasonal offer should be expanded next.',
        ],
      },
    ],
  },
  {
    kind: 'insight',
    slug: 'ai-assisted-academy-operations',
    title: 'AI-assisted operations',
    seoTitle: 'AI-assisted academy operations with human oversight',
    excerpt: 'Use AI to remove operational friction, not replace educators.',
    category: 'AI operations',
    keywords: ['AI for academies', 'academy automation', 'education operations software'],
    author: 'Akademate Editorial Team',
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
      {
        title: 'Keep evidence beside every suggestion',
        paragraphs: [
          'A useful recommendation should show the records that informed it: the relevant programme, recent messages, outstanding requirements or schedule conflict. This lets the operator validate the suggestion quickly and understand when context is incomplete.',
          'Traceable assistance is especially important when a workflow touches payments, learner progress or access. The system should record what was prepared, who reviewed it and which action was finally taken instead of reducing accountability to a conversational transcript.',
        ],
      },
      {
        title: 'Introduce assistance as an operating capability',
        paragraphs: [
          'Academies can begin with one bounded workflow, measure the time recovered and expand only when the review process is reliable. A narrow use case such as enquiry summarisation often creates more value than a broad assistant with unclear responsibilities.',
          'This approach keeps AI optional and makes adoption practical for teams. The connected academy operation remains the product foundation; assistance becomes another governed capability that can be enabled where it improves speed, consistency and service quality.',
        ],
      },
    ],
  },
  {
    kind: 'insight',
    slug: 'one-operation-in-person-online-academies',
    title: 'One academy, on-site and online',
    seoTitle: 'How to manage in-person and online academy operations together',
    excerpt: 'Unify physical and digital teaching in one operation.',
    category: 'Academy operations',
    keywords: ['hybrid academy management', 'virtual campus', 'academy operations'],
    author: 'Akademate Editorial Team',
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
      {
        title: 'Connect communication across delivery modes',
        paragraphs: [
          'A schedule change should reach the right learners whether a session moves to another room, becomes online or is rescheduled entirely. Teachers need one channel for announcements, private feedback and the resources attached to the session.',
          'Keeping communication connected to the programme reduces missed information and preserves context for future support. Learners can understand what changed and what action is required without searching across unrelated message threads.',
        ],
      },
      {
        title: 'Plan capacity as a shared resource',
        paragraphs: [
          'Hybrid delivery adds flexibility but also creates new planning questions. A physical room has a fixed capacity, an online session may have facilitation limits and a teacher cannot be assigned to overlapping groups. These constraints belong in the same operational model.',
          'A shared view helps the academy compare demand with available teaching capacity, rooms and online delivery options. It supports growth without treating digital delivery as unlimited or physical delivery as disconnected from the learner campus.',
          'The same view can inform registration limits, waitlists and the decision to add another session. Capacity becomes a service-quality decision as well as a scheduling constraint, helping teams protect meaningful interaction in every delivery mode.',
        ],
      },
    ],
  },
  {
    kind: 'news',
    slug: 'academy-setup-blueprint-to-live',
    title: 'Academy setup, blueprint to live',
    seoTitle: 'Akademate introduces a visual academy setup journey',
    excerpt: 'Build one academy model through six clear launch stages.',
    category: 'Product news',
    keywords: ['academy onboarding', 'academy setup software', 'education management platform'],
    author: 'Akademate Product Team',
    date: '2026-08-01',
    displayDate: '1 August 2026',
    readingTime: '7 min read',
    image: '/images/academy-setup/academy-stage-06-live.jpg',
    imageAlt: 'A compact Akademate academy rendered live after its visual setup journey',
    introduction:
      'Starting an academy platform should feel like building a coherent operation, not completing an unrelated collection of forms. Akademate is introducing a six-stage visual setup journey that keeps one academy model in view as its structure, spaces, programmes, people, operations and identity come together.',
    sections: [
      {
        title: 'One academy remains visible throughout setup',
        paragraphs: [
          'The journey begins with an isometric blueprint and ends with the same academy illuminated and ready. The footprint, entrance, classrooms and visual perspective remain consistent across every stage so the operator can understand what has been configured and what still needs attention.',
          'This continuity replaces a generic percentage with a concrete model. Progress is represented by the academy becoming more complete: structure appears, surfaces are added, spaces become usable, identity is applied and the final operation goes live.',
        ],
      },
      {
        title: 'Six stages connect setup to real operations',
        paragraphs: [
          'Academy Blueprint defines the operating model and launch priorities. Campuses and Spaces represents locations, rooms and online capacity. Programmes and Offers adds schedules, enrolment rules and pricing. People and Access prepares the responsibilities of teams, teachers, learners and families.',
          'Learning and Operations connects campus delivery, communication, payments and reporting. Academy Live completes brand, website and launch readiness. The stages are designed as an orientation layer rather than a replacement for the detailed settings behind each decision.',
        ],
        points: [
          'Academy blueprint',
          'Campuses and spaces',
          'Programmes and offers',
          'People and access',
          'Learning and operations',
          'Academy Live',
        ],
      },
      {
        title: 'A shared contract for public storytelling and onboarding',
        paragraphs: [
          'The six stages are defined in a reusable Akademate interface contract. The public website uses that contract to explain the product journey, while the future tenant onboarding experience can consume the same stage identifiers, descriptions and visual assets.',
          'Centralising the model avoids two versions of setup drifting apart. A change to the meaning or order of a stage can be reviewed once and then reflected consistently wherever the setup journey appears.',
        ],
      },
      {
        title: 'Progress should reflect completed configuration',
        paragraphs: [
          'The visual sequence is not intended to claim that provisioning is complete because an image has changed. In the operational onboarding flow, each state will be driven by explicit configuration evidence such as a saved campus, a published offer, assigned roles or approved launch settings.',
          'That distinction keeps the experience motivating without turning presentation into false status. Operators should be able to open a stage, see the outstanding decisions and understand which action will move the academy forward.',
        ],
      },
      {
        title: 'Designed for one location or a growing network',
        paragraphs: [
          'The compact academy visual represents the first operating unit, but the setup contract includes multiple campuses, rooms and online capacity. A growing organisation can establish shared standards while configuring the details that belong to each location or entity.',
          'This creates a consistent starting point for an independent academy, a specialist studio, a seasonal programme or a multi-site group. The interface stays recognisable even as the operational model becomes more sophisticated.',
        ],
      },
      {
        title: 'What comes next',
        paragraphs: [
          'The public sequence is now the visual foundation for the onboarding work that follows. The next product phase will connect each stage to saved tenant configuration, readiness checks, permission-aware tasks and a clear return path when information needs to be revised.',
          'Akademate will validate the operational wiring separately before describing the onboarding workflow as complete. The immediate improvement is a clearer product story and a reusable model for turning setup into an understandable, progressive experience.',
        ],
      },
    ],
  },
] as const

export const insightPosts = blogPosts.filter((post) => post.kind === 'insight')
export const newsPosts = blogPosts.filter((post) => post.kind === 'news')

export function getBlogPost(slug: string) {
  return insightPosts.find((post) => post.slug === slug)
}

export function getNewsPost(slug: string) {
  return newsPosts.find((post) => post.slug === slug)
}

export function getEditorialPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

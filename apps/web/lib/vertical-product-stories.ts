import type { IntegrationBrandId } from '@/lib/integration-brands'

type StoryField = { label: string; options: string[] }
type StoryMoment = {
  id: string
  label: string
  title: string
  text: string
  metric: string
  metricLabel: string
  fields: StoryField[]
  activity: string[]
  connectors?: IntegrationBrandId[]
}
type VerticalProductStory = { noun: string; moments: StoryMoment[] }

export const verticalProductStories: Record<string, VerticalProductStory> = {
  'professional-training': {
    noun: 'training centre',
    moments: [
      {
        id: 'programme',
        label: 'Programme',
        title: 'Build a compliant intake around the real programme.',
        text: 'Define qualification, delivery format, entry route, documents and available campuses.',
        metric: '24',
        metricLabel: 'places in September intake',
        fields: [
          {
            label: 'Programme',
            options: ['Level 3 Digital Marketing', 'Project Management Diploma'],
          },
          { label: 'Delivery', options: ['Hybrid', 'In person', 'Online'] },
          { label: 'Campus', options: ['Central campus', 'North campus', 'Online campus'] },
        ],
        activity: [
          'Entry requirements attached',
          'Two assessment dates available',
          'Application route published',
        ],
      },
      {
        id: 'admissions',
        label: 'Admissions',
        title: 'Move every applicant through one visible decision process.',
        text: 'Track eligibility, documentation, interviews, approval and place acceptance without parallel spreadsheets.',
        metric: '42',
        metricLabel: 'active applications',
        fields: [
          {
            label: 'Application status',
            options: ['Ready to review', 'Awaiting documents', 'Approved'],
          },
          {
            label: 'Required document',
            options: ['Identity', 'Prior qualification', 'Funding evidence'],
          },
          { label: 'Reviewer', options: ['Admissions team', 'Programme lead'] },
        ],
        activity: ['12 ready to review', '8 awaiting evidence', '6 places held'],
      },
      {
        id: 'delivery',
        label: 'Delivery',
        title: 'Connect timetable, attendance, assessment and campus.',
        text: 'Teachers see their course workspace while learners move between classroom, live sessions and resources.',
        metric: '92%',
        metricLabel: 'cohort attendance',
        fields: [
          { label: 'Cohort', options: ['DM-SEP-26', 'PM-OCT-26'] },
          { label: 'Session', options: ['Classroom workshop', 'Live online tutorial'] },
          { label: 'Assessment', options: ['Portfolio', 'Practical observation'] },
        ],
        activity: ['Attendance recorded', 'Portfolio feedback due', 'Next live tutorial scheduled'],
        connectors: ['zoom', 'googlemeet'],
      },
      {
        id: 'finance',
        label: 'Finance',
        title: 'Keep fees and instalments attached to the enrolment.',
        text: 'Collect deposits or instalments, monitor receivables and reconcile the receiving academy entity.',
        metric: '98%',
        metricLabel: 'payments reconciled',
        fields: [
          {
            label: 'Payment plan',
            options: ['3 monthly instalments', 'Single payment', 'Funded place'],
          },
          { label: 'Payment method', options: ['Stripe card', 'PayPal', 'SEPA debit'] },
          { label: 'Receiving entity', options: ['Main training centre', 'North campus'] },
        ],
        activity: ['Deposit received', 'Next instalment in 12 days', 'Invoice available'],
        connectors: ['stripe', 'paypal', 'sepa'],
      },
    ],
  },
  wellness: {
    noun: 'wellness studio',
    moments: [
      {
        id: 'classes',
        label: 'Classes',
        title: 'Create the class schedule members want to return to.',
        text: 'Offer yoga, pilates, reformer and private sessions by level, instructor and studio.',
        metric: '18',
        metricLabel: 'classes today',
        fields: [
          {
            label: 'Class',
            options: ['Vinyasa Flow', 'Reformer Pilates', 'Hatha Yoga', 'Private session'],
          },
          { label: 'Level', options: ['Open level', 'Beginner', 'Intermediate'] },
          { label: 'Instructor', options: ['Maya Chen', 'Sofia Lind', 'Daniel Moore'] },
        ],
        activity: ['Vinyasa has 3 places left', 'Reformer waitlist active', 'Substitute confirmed'],
      },
      {
        id: 'studios',
        label: 'Studios',
        title: 'Protect room, equipment and instructor capacity.',
        text: 'Coordinate every physical studio and your online schedule without double-booking spaces or people.',
        metric: '4',
        metricLabel: 'connected studio spaces',
        fields: [
          { label: 'Location', options: ['Riverside Studio', 'North Studio', 'Online studio'] },
          { label: 'Room', options: ['Sun Room', 'Reformer Room', 'Private Room'] },
          { label: 'Capacity', options: ['16 mats', '10 reformers', '1 private client'] },
        ],
        activity: ['Sun Room ready', '10 reformers available', 'Online room opens 10 min early'],
      },
      {
        id: 'members',
        label: 'Members',
        title: 'Make booking and check-in effortless.',
        text: 'Let members use trials, drop-ins, packs or memberships while the team sees attendance and retention.',
        metric: '84%',
        metricLabel: 'monthly retention',
        fields: [
          { label: 'Member', options: ['Amelia Torres', 'Noah Berg', 'New trial'] },
          { label: 'Access', options: ['Monthly unlimited', '10-class pack', 'Drop-in'] },
          { label: 'Check-in', options: ['Front desk', 'QR check-in'] },
        ],
        activity: [
          'Trial converted to membership',
          'Pack has 3 sessions left',
          'Renewal reminder prepared',
        ],
      },
      {
        id: 'payments',
        label: 'Payments',
        title: 'Sell the right studio experience in one checkout.',
        text: 'Connect the selected class, studio, cancellation policy and recurring payment to the member record.',
        metric: '€89',
        metricLabel: 'monthly unlimited membership',
        fields: [
          { label: 'Purchase', options: ['Monthly unlimited', '10-class pack', 'Single class'] },
          { label: 'Studio', options: ['Riverside Studio', 'All locations'] },
          { label: 'Payment method', options: ['Stripe card', 'PayPal', 'SEPA debit'] },
        ],
        activity: [
          'Next renewal 1 September',
          '14-day cancellation policy',
          'Receipt sent automatically',
        ],
        connectors: ['stripe', 'paypal', 'sepa', 'visa', 'mastercard', 'applepay', 'googlepay'],
      },
    ],
  },
  sports: {
    noun: 'sports academy',
    moments: [
      {
        id: 'trials',
        label: 'Trials',
        title: 'Turn interest into the right trial and team placement.',
        text: 'Capture age, experience, guardian details and preferred location before the assessment.',
        metric: '24',
        metricLabel: 'trials this week',
        fields: [
          { label: 'Programme', options: ['U14 Football', 'Junior Tennis', 'Performance Camp'] },
          { label: 'Age group', options: ['Under 10', 'Under 14', 'Under 18'] },
          { label: 'Trial venue', options: ['North Field', 'Central Courts'] },
        ],
        activity: ['Guardian invited', 'Assessment rubric ready', 'Coach assigned'],
      },
      {
        id: 'teams',
        label: 'Teams',
        title: 'Coordinate squads, coaches and seasonal schedules.',
        text: 'Keep rosters, training groups, attendance and substitutions connected to the season.',
        metric: '12',
        metricLabel: 'active teams',
        fields: [
          { label: 'Team', options: ['U14 Blue', 'U14 White', 'U16 Performance'] },
          { label: 'Coach', options: ['Alex Romero', 'Jordan Lee'] },
          { label: 'Season', options: ['Autumn 2026', 'Winter 2026'] },
        ],
        activity: ['Roster has 18 athletes', 'Two licence renewals due', 'Away session confirmed'],
      },
      {
        id: 'facilities',
        label: 'Facilities',
        title: 'Plan every pitch, court and equipment requirement.',
        text: 'Match sessions to facilities, capacity and equipment without hidden calendar conflicts.',
        metric: '91%',
        metricLabel: 'facility utilisation',
        fields: [
          { label: 'Facility', options: ['North Field 1', 'Central Court 2', 'Strength Studio'] },
          { label: 'Equipment', options: ['Football kit', 'Tennis baskets', 'Timing gates'] },
          { label: 'Session', options: ['Team training', 'Assessment', 'Private coaching'] },
        ],
        activity: ['Pitch inspection complete', 'Equipment reserved', 'Weather update shared'],
      },
      {
        id: 'fees',
        label: 'Fees',
        title: 'Connect season fees, licences and family payments.',
        text: 'Collect deposits, subscriptions or season fees with guardian consent and clear renewal dates.',
        metric: '96%',
        metricLabel: 'season fees collected',
        fields: [
          { label: 'Fee', options: ['Full season', 'Monthly plan', 'Trial deposit'] },
          { label: 'Participant', options: ['Leo Martin', 'Mia Jensen'] },
          { label: 'Payment method', options: ['Stripe card', 'PayPal', 'SEPA debit'] },
        ],
        activity: ['Guardian authorised payment', 'Licence fee included', 'Receipt shared'],
        connectors: ['stripe', 'paypal', 'sepa'],
      },
    ],
  },
  seasonal: {
    noun: 'seasonal programme',
    moments: [
      {
        id: 'launch',
        label: 'Launch',
        title: 'Publish a complete camp in one focused setup.',
        text: 'Turn dates, age groups, activities and capacity into a page families can understand and book.',
        metric: '6',
        metricLabel: 'weeks open for booking',
        fields: [
          {
            label: 'Programme',
            options: ['Summer Multisport', 'Creative Week', 'Language Adventure'],
          },
          { label: 'Week', options: ['6–10 July', '13–17 July', '20–24 July'] },
          { label: 'Age group', options: ['6–8 years', '9–12 years', '13–15 years'] },
        ],
        activity: ['Social preview ready', 'Early booking open', 'Capacity rules applied'],
      },
      {
        id: 'families',
        label: 'Families',
        title: 'Collect every detail before arrival day.',
        text: 'Keep guardian consent, health information, authorised pickup and documents together.',
        metric: '88%',
        metricLabel: 'forms complete',
        fields: [
          {
            label: 'Form',
            options: ['Health and allergies', 'Photo consent', 'Pickup authorisation'],
          },
          { label: 'Status', options: ['Complete', 'Needs attention'] },
          { label: 'Guardian', options: ['Primary guardian', 'Additional contact'] },
        ],
        activity: ['12 reminders scheduled', '3 allergy notes flagged', 'Pickup list ready'],
      },
      {
        id: 'checkin',
        label: 'Check-in',
        title: 'Give the team a calm first morning.',
        text: 'See arrivals, groups, leaders and exceptions without printing or reconciling several lists.',
        metric: '74',
        metricLabel: 'participants arriving Monday',
        fields: [
          { label: 'Check-in point', options: ['Main entrance', 'Sports field'] },
          { label: 'Group', options: ['Blue group', 'Green group', 'Orange group'] },
          { label: 'Status', options: ['Expected', 'Checked in', 'Late arrival'] },
        ],
        activity: ['Leader roster shared', 'Medical notes visible', 'Pickup code prepared'],
      },
      {
        id: 'deposits',
        label: 'Deposits',
        title: 'Take deposits and complete payment before the programme.',
        text: 'Set deposit, balance deadline, cancellation policy and eligible discounts per camp week.',
        metric: '€75',
        metricLabel: 'booking deposit',
        fields: [
          { label: 'Payment plan', options: ['Deposit + balance', 'Pay in full'] },
          { label: 'Discount', options: ['Sibling discount', 'Multi-week', 'None'] },
          { label: 'Method', options: ['Stripe card', 'PayPal'] },
        ],
        activity: ['Balance due 30 days before', 'Sibling discount applied', 'Confirmation sent'],
        connectors: ['stripe', 'paypal'],
      },
    ],
  },
  'performing-arts': {
    noun: 'performing arts academy',
    moments: [
      {
        id: 'disciplines',
        label: 'Disciplines',
        title: 'Shape an offer around discipline, level and format.',
        text: 'Publish dance, music, theatre and private lessons with the right progression and prerequisites.',
        metric: '34',
        metricLabel: 'weekly class formats',
        fields: [
          { label: 'Discipline', options: ['Contemporary Dance', 'Piano', 'Musical Theatre'] },
          { label: 'Level', options: ['Foundation', 'Intermediate', 'Advanced'] },
          { label: 'Format', options: ['Group class', 'Private lesson', 'Ensemble'] },
        ],
        activity: ['Trial class available', 'Level guidance published', 'Recital pathway linked'],
      },
      {
        id: 'studios',
        label: 'Studios',
        title: 'Keep studios, instruments and teachers in rhythm.',
        text: 'Coordinate recurring lessons with room suitability, equipment and teacher availability.',
        metric: '7',
        metricLabel: 'specialist spaces',
        fields: [
          { label: 'Space', options: ['Dance Studio A', 'Piano Room 2', 'Black Box'] },
          { label: 'Resource', options: ['Grand piano', 'Sound system', 'Mirrors and barre'] },
          { label: 'Recurrence', options: ['Weekly', 'Fortnightly', 'One-off'] },
        ],
        activity: ['Piano tuned', 'Studio change notified', 'Teacher cover available'],
      },
      {
        id: 'progress',
        label: 'Progress',
        title: 'Connect practice, feedback and performance preparation.',
        text: 'Teachers share resources and feedback while learners see goals, rehearsals and progress.',
        metric: '82%',
        metricLabel: 'practice goals completed',
        fields: [
          { label: 'Learner', options: ['Ava Collins', 'Elias Moore'] },
          { label: 'Goal', options: ['Technique', 'Repertoire', 'Performance'] },
          { label: 'Feedback', options: ['Private note', 'Video review'] },
        ],
        activity: ['Video submission reviewed', 'New score shared', 'Rehearsal reminder sent'],
        connectors: ['vimeo', 'youtube'],
      },
      {
        id: 'family-billing',
        label: 'Billing',
        title: 'Simplify recurring lessons and family accounts.',
        text: 'Combine siblings, private lessons, ensembles and performance fees in a clear account.',
        metric: '€145',
        metricLabel: 'family monthly plan',
        fields: [
          { label: 'Account', options: ['Collins family', 'Moore family'] },
          { label: 'Plan', options: ['Monthly tuition', 'Term fee', 'Lesson pack'] },
          { label: 'Method', options: ['Stripe card', 'SEPA debit'] },
        ],
        activity: ['Two learners included', 'Recital fee scheduled', 'Next invoice prepared'],
        connectors: ['stripe', 'sepa'],
      },
    ],
  },
  'online-cohorts': {
    noun: 'online academy',
    moments: [
      {
        id: 'cohort',
        label: 'Cohort',
        title: 'Build a cohort around timezone, pace and outcome.',
        text: 'Connect application, curriculum, live sessions and community from the first enrolment.',
        metric: '36',
        metricLabel: 'learners in next cohort',
        fields: [
          { label: 'Programme', options: ['Product Leadership', 'Data Foundations'] },
          { label: 'Timezone', options: ['Europe', 'Americas', 'Asia Pacific'] },
          { label: 'Pace', options: ['8 weeks', '12 weeks', 'Self-paced + live'] },
        ],
        activity: ['Orientation published', 'Calendar generated', 'Community spaces ready'],
      },
      {
        id: 'live',
        label: 'Live learning',
        title: 'Make every live session easy to join and revisit.',
        text: 'Coordinate facilitators, meeting rooms, attendance, recordings and follow-up resources.',
        metric: '8',
        metricLabel: 'live sessions this week',
        fields: [
          { label: 'Session', options: ['Workshop', 'Office hours', 'Guest session'] },
          { label: 'Room', options: ['Zoom', 'Google Meet'] },
          { label: 'Recording', options: ['Publish to cohort', 'Facilitator only'] },
        ],
        activity: ['Room opens 10 minutes early', 'Recording processing', 'Attendance synced'],
        connectors: ['zoom', 'googlemeet', 'vimeo'],
      },
      {
        id: 'community',
        label: 'Community',
        title: 'Keep assignments and conversation close to the course.',
        text: 'Give learners a clear next step, private teacher support and cohort discussion.',
        metric: '78%',
        metricLabel: 'weekly engagement',
        fields: [
          { label: 'Activity', options: ['Assignment', 'Discussion', 'Peer review'] },
          { label: 'Audience', options: ['Whole cohort', 'Study group', 'Individual'] },
          { label: 'Feedback', options: ['Rubric', 'Private chat', 'Video note'] },
        ],
        activity: [
          '12 submissions received',
          '3 private questions open',
          'Peer review closes Friday',
        ],
      },
      {
        id: 'subscription',
        label: 'Payment',
        title: 'Sell a cohort, subscription or payment plan globally.',
        text: 'Attach payment terms, access dates and cancellation rules to the learner account.',
        metric: '€320',
        metricLabel: 'three-part payment plan',
        fields: [
          { label: 'Access', options: ['Cohort enrolment', 'Monthly subscription'] },
          { label: 'Currency', options: ['EUR', 'GBP', 'USD'] },
          { label: 'Method', options: ['Stripe card', 'PayPal'] },
        ],
        activity: ['Access begins on payment', 'Second instalment scheduled', 'Invoice available'],
        connectors: ['stripe', 'paypal'],
      },
    ],
  },
  languages: {
    noun: 'language academy',
    moments: [
      {
        id: 'placement',
        label: 'Placement',
        title: 'Place every learner at the right level.',
        text: 'Connect placement result, learning goal, availability and preferred campus before group matching.',
        metric: 'B2',
        metricLabel: 'recommended CEFR level',
        fields: [
          { label: 'Language', options: ['English', 'Spanish', 'German'] },
          { label: 'Goal', options: ['General fluency', 'Exam preparation', 'Business'] },
          { label: 'Placement', options: ['Online test', 'Teacher interview'] },
        ],
        activity: [
          'Written score received',
          'Speaking interview booked',
          'Three matching groups found',
        ],
      },
      {
        id: 'groups',
        label: 'Groups',
        title: 'Build balanced groups around level and availability.',
        text: 'See campuses, classrooms, teachers and online alternatives before confirming a place.',
        metric: '8',
        metricLabel: 'B2 groups with availability',
        fields: [
          { label: 'Schedule', options: ['Mon + Wed 18:00', 'Tue + Thu 10:00'] },
          { label: 'Location', options: ['Central campus', 'North campus', 'Online'] },
          { label: 'Teacher', options: ['Emma Hall', 'Lucas Meyer'] },
        ],
        activity: ['Average group size 9', 'Hybrid room available', 'Coursebook reserved'],
      },
      {
        id: 'learning',
        label: 'Learning',
        title: 'Keep classroom and online progress aligned.',
        text: 'Track attendance, homework, speaking feedback, grades and level progression in one campus.',
        metric: '91%',
        metricLabel: 'monthly attendance',
        fields: [
          { label: 'Skill', options: ['Speaking', 'Writing', 'Listening', 'Reading'] },
          { label: 'Activity', options: ['Homework', 'Live class', 'Mock exam'] },
          { label: 'Feedback', options: ['Gradebook', 'Private teacher note'] },
        ],
        activity: ['Homework returned', 'Speaking feedback shared', 'Mock exam scheduled'],
      },
      {
        id: 'monthly',
        label: 'Monthly billing',
        title: 'Connect recurring tuition to the active group.',
        text: 'Manage monthly billing, term fees, materials and transfers without losing the learner history.',
        metric: '€119',
        metricLabel: 'monthly group tuition',
        fields: [
          { label: 'Billing', options: ['Monthly', 'Term', 'Full course'] },
          { label: 'Materials', options: ['Included', 'Separate charge'] },
          { label: 'Method', options: ['SEPA debit', 'Stripe card', 'PayPal'] },
        ],
        activity: [
          'Next collection 1 September',
          'Coursebook included',
          'Group transfer keeps billing',
        ],
        connectors: ['sepa', 'stripe', 'paypal'],
      },
    ],
  },
  networks: {
    noun: 'academy network',
    moments: [
      {
        id: 'structure',
        label: 'Structure',
        title: 'Model the group without flattening local operations.',
        text: 'Represent the organisation, brands, campuses and online entities with clear responsibility.',
        metric: '14',
        metricLabel: 'campuses in the group',
        fields: [
          { label: 'Brand', options: ['Akademate North', 'Akademate City'] },
          { label: 'Entity', options: ['Group company', 'Local operator'] },
          { label: 'Campus', options: ['Stockholm Central', 'Malmö South', 'Online Europe'] },
        ],
        activity: [
          'Shared brand rules active',
          'Local catalogue assigned',
          'Domain resolves to campus',
        ],
      },
      {
        id: 'permissions',
        label: 'Permissions',
        title: 'Give local teams control without losing governance.',
        text: 'Scope people to the campuses, finance responsibilities and participant records they own.',
        metric: '6',
        metricLabel: 'role templates',
        fields: [
          { label: 'Role', options: ['Group director', 'Campus manager', 'Teacher'] },
          { label: 'Scope', options: ['All campuses', 'One campus', 'Assigned programmes'] },
          { label: 'Finance access', options: ['Consolidated', 'Local only', 'None'] },
        ],
        activity: [
          'Quarterly review scheduled',
          'Two role changes pending',
          'Audit context recorded',
        ],
      },
      {
        id: 'local',
        label: 'Local operation',
        title: 'Let every campus run a relevant local experience.',
        text: 'Use local schedules, capacity, offers, language and communications on the shared foundation.',
        metric: '92%',
        metricLabel: 'catalogue consistency',
        fields: [
          { label: 'Campus', options: ['Stockholm Central', 'Malmö South'] },
          { label: 'Catalogue', options: ['Shared programmes', 'Local programmes'] },
          { label: 'Communication', options: ['Local language', 'Group template'] },
        ],
        activity: ['Local holiday applied', 'Capacity updated', 'Campaign page published'],
      },
      {
        id: 'consolidated',
        label: 'Group finance',
        title: 'See local responsibility and group performance together.',
        text: 'Route payments to the agreed entity and consolidate revenue, occupancy and receivables.',
        metric: '€284k',
        metricLabel: 'group monthly revenue',
        fields: [
          { label: 'View', options: ['Consolidated group', 'By brand', 'By campus'] },
          { label: 'Receiving entity', options: ['Group entity', 'Local operator'] },
          { label: 'Settlement', options: ['Stripe', 'PayPal', 'SEPA'] },
        ],
        activity: [
          '13 of 14 campuses reconciled',
          'Local margin available',
          'Group forecast refreshed',
        ],
        connectors: ['stripe', 'paypal', 'sepa'],
      },
    ],
  },
}

export const verticalProductStorySlugs = Object.keys(verticalProductStories)

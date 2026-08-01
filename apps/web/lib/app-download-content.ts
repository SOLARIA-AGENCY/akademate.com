export const appDownloadOptions = [
  {
    id: 'mac',
    label: 'Mac',
    title: 'Akademate for Mac',
    description: 'A focused desktop workspace for academy teams.',
    image: '/images/download/akademate-mac-app-v1.jpg',
    imageAlt: 'Akademate desktop workspace presented on a laptop',
    capabilities: ['Daily operations', 'Schedules and people', 'Finance overview'],
    status: 'Coming soon',
  },
  {
    id: 'iphone',
    label: 'iPhone',
    title: 'Akademate for iPhone',
    description: 'Classes, messages and attendance wherever work happens.',
    image: '/images/download/akademate-iphone-app-v1.jpg',
    imageAlt: 'Akademate mobile workspace presented on a smartphone',
    capabilities: ['Today view', 'Messages', 'Attendance'],
    status: 'Coming soon',
  },
  {
    id: 'ipad',
    label: 'iPad',
    title: 'Akademate for iPad',
    description: 'A touch-first workspace for teaching and front desks.',
    image: '/images/download/akademate-ipad-app-v1.jpg',
    imageAlt: 'Akademate touch workspace presented on a tablet',
    capabilities: ['Class workspace', 'Check-in', 'Learner records'],
    status: 'Coming soon',
  },
] as const

export type AppDownloadId = (typeof appDownloadOptions)[number]['id']

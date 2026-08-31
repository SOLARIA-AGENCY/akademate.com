export const WIZARD_STEPS = [
  'identify',
  'personal',
  'course',
  'consent',
  'payment',
  'access',
  'review',
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]

export const WIZARD_STAGES = [
  { id: 1, slug: 'convocatoria', title: 'Convocatoria', stepIds: ['course'] },
  { id: 2, slug: 'alumno', title: 'Alumno', stepIds: ['identify', 'personal'] },
  { id: 3, slug: 'pago', title: 'Pago y RGPD', stepIds: ['consent', 'payment', 'access'] },
  { id: 4, slug: 'confirmar', title: 'Confirmar', stepIds: ['review'] },
] as const

export type WizardStageId = (typeof WIZARD_STAGES)[number]['id']

export type AccessKind = 'fisico' | 'virtual' | 'hibrido'
export type PaymentMethod = 'sepa' | 'card_online' | 'card_pos' | 'transfer' | 'cash'
export const PAYMENT_METHODS: PaymentMethod[] = ['sepa', 'card_online', 'card_pos', 'transfer', 'cash']
export type PaymentPlan = 'unico' | 'fraccionado'
export type PersonMode = 'existing' | 'new'

export interface EnrollmentPerson {
  id: string | null
  firstName: string
  lastName: string
  dni: string
  email: string
  phone: string
  photoDataUrl: string | null
  alreadyEnrolled: boolean
  hasActiveCourses: boolean
}

export interface EnrollmentCourseOption {
  id: string
  name: string
  campusId: string
  campusName: string
  startDate: string
  endDate: string
  seatsUsed: number
  seatsMax: number
  price: number
  enrollmentFee: number
  modality: string
  accessKind: AccessKind
  status: string
}

export interface EnrollmentDraft {
  step: WizardStepId
  personMode: PersonMode
  person: EnrollmentPerson
  searchQuery: string
  course: EnrollmentCourseOption | null
  campusFilter: string
  typeFilter: string
  consentAccepted: boolean
  consentAt: string | null
  consentBy: string
  discount: number
  paymentMethod: PaymentMethod | null
  paymentPlan: PaymentPlan
  accessPhoto: string | null
  accessPass: 'credential' | 'temporary' | 'visitor' | null
  virtualSendChannel: 'email' | 'sms' | null
}

export const DRAFT_STORAGE_KEY = 'akademate.enrollment.draft.v1'

export function createEmptyDraft(): EnrollmentDraft {
  return {
    step: 'course',
    personMode: 'existing',
    person: {
      id: null,
      firstName: '',
      lastName: '',
      dni: '',
      email: '',
      phone: '',
      photoDataUrl: null,
      alreadyEnrolled: false,
      hasActiveCourses: false,
    },
    searchQuery: '',
    course: null,
    campusFilter: 'todas',
    typeFilter: 'todos',
    consentAccepted: false,
    consentAt: null,
    consentBy: '',
    discount: 0,
    paymentMethod: null,
    paymentPlan: 'unico',
    accessPhoto: null,
    accessPass: null,
    virtualSendChannel: 'email',
  }
}

export function parseWizardStage(raw: string | null | undefined): WizardStageId {
  const n = Number(raw)
  if (n === 5 || n === 6) return 3
  if (n === 7) return 4
  if (n >= 1 && n <= 4) return n as WizardStageId
  if (raw === 'course') return 1
  if (raw === 'identify' || raw === 'personal') return 2
  if (raw === 'consent' || raw === 'payment' || raw === 'access') return 3
  if (raw === 'review') return 4
  return 1
}

export function wizardStageFromStep(step: WizardStepId): WizardStageId {
  switch (step) {
    case 'course':
      return 1
    case 'identify':
    case 'personal':
      return 2
    case 'consent':
    case 'payment':
    case 'access':
      return 3
    case 'review':
      return 4
    default: {
      const _exhaustive: never = step
      return _exhaustive
    }
  }
}

export function wizardStepFromStage(stage: WizardStageId): WizardStepId {
  switch (stage) {
    case 1:
      return 'course'
    case 2:
      return 'personal'
    case 3:
      return 'consent'
    case 4:
      return 'review'
    default: {
      const _exhaustive: never = stage
      return _exhaustive
    }
  }
}

export function wizardStageTitle(id: WizardStageId): string {
  return WIZARD_STAGES.find((stage) => stage.id === id)?.title ?? String(id)
}

export function wizardStepTitle(step: WizardStepId): string {
  switch (step) {
    case 'identify':
      return 'Identificar persona'
    case 'personal':
      return 'Datos personales'
    case 'course':
      return 'Curso y convocatoria'
    case 'consent':
      return 'Consentimiento'
    case 'payment':
      return 'Matrícula y cobro'
    case 'access':
      return 'Acceso y credencial'
    case 'review':
      return 'Resumen'
    default: {
      const _exhaustive: never = step
      return _exhaustive
    }
  }
}

export function accessKindFromModality(modality?: string | null): AccessKind {
  const value = String(modality ?? '').toLowerCase()
  if (value === 'online' || value === 'virtual') return 'virtual'
  if (value === 'hibrido' || value === 'hybrid') return 'hibrido'
  return 'fisico'
}

export function accessKindLabel(kind: AccessKind): string {
  switch (kind) {
    case 'fisico':
      return 'Físico'
    case 'virtual':
      return 'Virtual'
    case 'hibrido':
      return 'Híbrido'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export function visibleWizardSteps(_kind: AccessKind | null): WizardStepId[] {
  return [...WIZARD_STEPS]
}

export function payableAmount(draft: EnrollmentDraft): number {
  const base = draft.course?.price ?? 0
  const fee = draft.course?.enrollmentFee ?? 0
  return Math.max(0, base + fee - draft.discount)
}

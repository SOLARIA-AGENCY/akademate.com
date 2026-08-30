import {
  DRAFT_STORAGE_KEY,
  createEmptyDraft,
  type EnrollmentDraft,
  type WizardStepId,
  WIZARD_STEPS,
} from './types'

function isWizardStep(value: unknown): value is WizardStepId {
  return typeof value === 'string' && (WIZARD_STEPS as readonly string[]).includes(value)
}

export function loadEnrollmentDraft(): EnrollmentDraft {
  if (typeof window === 'undefined') return createEmptyDraft()
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return createEmptyDraft()
    const parsed = JSON.parse(raw) as Partial<EnrollmentDraft>
    const base = createEmptyDraft()
    return {
      ...base,
      ...parsed,
      person: { ...base.person, ...parsed.person },
      step: isWizardStep(parsed.step) ? parsed.step : base.step,
    }
  } catch {
    return createEmptyDraft()
  }
}

export function saveEnrollmentDraft(draft: EnrollmentDraft): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export function clearEnrollmentDraft(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DRAFT_STORAGE_KEY)
}

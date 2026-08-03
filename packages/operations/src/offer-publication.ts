import { z } from 'zod'

export const OfferPublicationAccess = {
  PRIVATE: 'private',
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
} as const

export const OfferConversionMode = {
  INFORMATION_ONLY: 'information_only',
  INTEREST_FORM: 'interest_form',
  FREE_REGISTRATION: 'free_registration',
  APPROVAL_REQUIRED: 'approval_required',
  PAID_REGISTRATION: 'paid_registration',
  EXTERNAL_LINK: 'external_link',
} as const

export const OfferCapacityPolicy = {
  LIMITED: 'limited',
  WAITLIST: 'waitlist',
  UNLIMITED: 'unlimited',
} as const

export const OfferPaymentPlan = {
  FULL_AMOUNT: 'full_amount',
  DEPOSIT: 'deposit',
} as const

const ShareSlugSchema = z
  .string()
  .min(3)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Share slug must use lowercase letters, numbers and hyphens')

const FormTemplateKeySchema = z
  .string()
  .min(3)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/, 'Invalid form template key')

const SecureExternalUrlSchema = z
  .url()
  .refine((value) => new URL(value).protocol === 'https:', 'External action URL must use HTTPS')

export const OfferPublicationInputSchema = z.object({
  publicationAccess: z.enum(['private', 'public', 'unlisted']).default('private'),
  conversionMode: z
    .enum([
      'information_only',
      'interest_form',
      'free_registration',
      'approval_required',
      'paid_registration',
      'external_link',
    ])
    .default('information_only'),
  shareSlug: ShareSlugSchema.optional(),
  formTemplateKey: FormTemplateKeySchema.optional(),
  externalActionUrl: SecureExternalUrlSchema.optional(),
  paymentPlan: z.enum(['full_amount', 'deposit']).optional(),
  priceAmount: z.number().positive().optional(),
  depositAmount: z.number().positive().optional(),
  ctaLabel: z.string().trim().min(1).max(80).optional(),
  capacityPolicy: z.enum(['limited', 'waitlist', 'unlimited']).default('limited'),
})

export const OfferPublicationSchema = OfferPublicationInputSchema.superRefine((value, context) => {
  if (value.publicationAccess !== 'private' && !value.shareSlug) {
    context.addIssue({
      code: 'custom',
      path: ['shareSlug'],
      message: 'A public or unlisted offer requires a share slug',
    })
  }

  if (
    (value.conversionMode === 'interest_form' || value.conversionMode === 'approval_required') &&
    !value.formTemplateKey
  ) {
    context.addIssue({
      code: 'custom',
      path: ['formTemplateKey'],
      message: 'This conversion mode requires a form template',
    })
  }

  if (
    (value.conversionMode === 'information_only' || value.conversionMode === 'external_link') &&
    value.formTemplateKey
  ) {
    context.addIssue({
      code: 'custom',
      path: ['formTemplateKey'],
      message: 'This conversion mode cannot submit an internal form',
    })
  }

  if (value.conversionMode === 'external_link' && !value.externalActionUrl) {
    context.addIssue({
      code: 'custom',
      path: ['externalActionUrl'],
      message: 'External link mode requires an HTTPS destination',
    })
  }

  if (value.conversionMode !== 'external_link' && value.externalActionUrl) {
    context.addIssue({
      code: 'custom',
      path: ['externalActionUrl'],
      message: 'Only external link mode can define an external destination',
    })
  }

  if (value.conversionMode === 'paid_registration') {
    if (!value.paymentPlan) {
      context.addIssue({
        code: 'custom',
        path: ['paymentPlan'],
        message: 'Paid registration requires a payment plan',
      })
    }
    if (!value.priceAmount) {
      context.addIssue({
        code: 'custom',
        path: ['priceAmount'],
        message: 'Paid registration requires a positive price',
      })
    }
  }

  if (value.conversionMode !== 'paid_registration' && (value.paymentPlan || value.depositAmount)) {
    context.addIssue({
      code: 'custom',
      path: ['paymentPlan'],
      message: 'Payment settings are only valid for paid registration',
    })
  }

  if (value.paymentPlan === 'deposit' && !value.depositAmount) {
    context.addIssue({
      code: 'custom',
      path: ['depositAmount'],
      message: 'Deposit payment requires a positive deposit amount',
    })
  }

  if (
    value.paymentPlan === 'deposit' &&
    value.depositAmount &&
    value.priceAmount &&
    value.depositAmount >= value.priceAmount
  ) {
    context.addIssue({
      code: 'custom',
      path: ['depositAmount'],
      message: 'Deposit amount must be lower than the full price',
    })
  }

  if (value.paymentPlan === 'full_amount' && value.depositAmount) {
    context.addIssue({
      code: 'custom',
      path: ['depositAmount'],
      message: 'Full-amount payment cannot define a deposit amount',
    })
  }
})

export type OfferPublication = z.infer<typeof OfferPublicationSchema>

export type OfferAction =
  | { kind: 'none' }
  | { kind: 'lead'; requiresApproval: boolean; formTemplateKey: string }
  | { kind: 'enrollment'; formTemplateKey?: string }
  | {
      kind: 'payment'
      priceAmount: number
      paymentPlan: 'full_amount' | 'deposit'
      depositAmount?: number
      formTemplateKey?: string
    }
  | { kind: 'redirect'; url: string }

export function resolveOfferAction(input: unknown): OfferAction {
  const offer = OfferPublicationSchema.parse(input)

  switch (offer.conversionMode) {
    case 'information_only':
      return { kind: 'none' }
    case 'interest_form':
      return { kind: 'lead', requiresApproval: false, formTemplateKey: offer.formTemplateKey! }
    case 'approval_required':
      return { kind: 'lead', requiresApproval: true, formTemplateKey: offer.formTemplateKey! }
    case 'free_registration':
      return { kind: 'enrollment', formTemplateKey: offer.formTemplateKey }
    case 'paid_registration':
      return {
        kind: 'payment',
        priceAmount: offer.priceAmount!,
        paymentPlan: offer.paymentPlan!,
        depositAmount: offer.depositAmount,
        formTemplateKey: offer.formTemplateKey,
      }
    case 'external_link':
      return { kind: 'redirect', url: offer.externalActionUrl! }
  }
}

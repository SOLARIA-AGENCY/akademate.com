import { z } from 'zod'

const optionalText = (max: number) => z.string().trim().max(max).optional().default('')

export const publicLeadSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: optionalText(120),
  email: z.string().trim().email().max(254),
  phone: optionalText(40),
  subject: z.enum(['demo', 'pricing', 'support', 'partnership', 'privacy', 'trial', 'other']),
  message: z.string().trim().min(10).max(4000),
  privacy_policy_accepted: z.literal(true),
  marketing_consent: z.literal(false).optional().default(false),
  website: optionalText(200),
  utm: z.object({
    source: optionalText(100),
    medium: optionalText(100),
    campaign: optionalText(100),
    term: optionalText(100),
    content: optionalText(100),
  }).optional(),
}).strict()

export const waitlistSchema = z.object({
  email: z.string().trim().email().max(254),
  privacy_policy_accepted: z.literal(true),
  website: optionalText(200),
}).strict()

export const MAX_PUBLIC_FORM_BYTES = 20_000

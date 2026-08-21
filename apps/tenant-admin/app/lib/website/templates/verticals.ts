/**
 * Website template verticals for empty / new tenants.
 * Universities and technical schools are out of v1.
 */
export const WEBSITE_VERTICALS = [
  'professional_studies',
  'wellness',
  'sports_academy',
  'coaching',
] as const

export type WebsiteVertical = (typeof WEBSITE_VERTICALS)[number]

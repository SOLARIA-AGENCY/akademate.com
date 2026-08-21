import { COACHING_TEMPLATE } from './coaching'
import { PROFESSIONAL_STUDIES_TEMPLATE } from './professional'
import { SPORTS_ACADEMY_TEMPLATE } from './sports'
import type { WebsiteTemplate } from './types'
import { WEBSITE_VERTICALS, type WebsiteVertical } from './verticals'
import { WELLNESS_TEMPLATE } from './wellness'

export const WEBSITE_TEMPLATE_CATALOG: Record<WebsiteVertical, WebsiteTemplate> = {
  professional_studies: PROFESSIONAL_STUDIES_TEMPLATE,
  wellness: WELLNESS_TEMPLATE,
  sports_academy: SPORTS_ACADEMY_TEMPLATE,
  coaching: COACHING_TEMPLATE,
}

export function getTemplate(vertical: WebsiteVertical): WebsiteTemplate {
  switch (vertical) {
    case 'professional_studies':
      return WEBSITE_TEMPLATE_CATALOG.professional_studies
    case 'wellness':
      return WEBSITE_TEMPLATE_CATALOG.wellness
    case 'sports_academy':
      return WEBSITE_TEMPLATE_CATALOG.sports_academy
    case 'coaching':
      return WEBSITE_TEMPLATE_CATALOG.coaching
    default: {
      const exhaustive: never = vertical
      return exhaustive
    }
  }
}

export function listTemplates(): WebsiteTemplate[] {
  return WEBSITE_VERTICALS.map((vertical) => getTemplate(vertical))
}

export { PROFESSIONAL_HOME_MODULE_KINDS } from './professional'
export { WEBSITE_VERTICALS } from './verticals'
export type { WebsiteVertical } from './verticals'
export type {
  WebsiteModuleKind,
  WebsiteTemplate,
  WebsiteTemplateModule,
  WebsiteTemplatePage,
} from './types'
export { legalTemplatePages } from './legal'

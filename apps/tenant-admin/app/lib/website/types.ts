export type WebsiteLink = {
  label: string
  href: string
}

export type WebsiteNavigationSource =
  | 'manual'
  | 'study_types'
  | 'cycles_by_level'
  | 'campuses'

export type WebsiteNavigationItem = WebsiteLink & {
  kind?: 'link' | 'dropdown'
  source?: WebsiteNavigationSource
  children?: WebsiteLink[]
}

export type ResolvedWebsiteNavigationGroup = {
  label: string
  children: WebsiteLink[]
}

export type ResolvedWebsiteNavigationItem = WebsiteLink & {
  kind: 'link' | 'dropdown'
  source?: WebsiteNavigationSource
  children?: WebsiteLink[]
  groups?: ResolvedWebsiteNavigationGroup[]
}

export type WebsiteHeroSlide = {
  image: string
  alt: string
  title?: string
  subtitle?: string
}

export type WebsiteSection =
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'heroCarousel'
      eyebrow?: string
      title: string
      subtitle: string
      slides: WebsiteHeroSlide[]
      primaryCta?: WebsiteLink
      secondaryCta?: WebsiteLink
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'statsStrip'
      items: Array<{ value: string; label: string }>
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'featureStrip'
      title?: string
      subtitle?: string
      items: Array<{ title: string; description: string; icon?: string }>
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'ctaBanner'
      title: string
      body: string
      cta?: WebsiteLink
      theme?: 'brand' | 'dark' | 'light'
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'jobPlacement'
      title: string
      subtitle?: string
      image: string
      cta: WebsiteLink
      secondaryCta?: WebsiteLink
      externalRegistrationUrl: string
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'courseList'
      title: string
      subtitle?: string
      limit?: number
      courseTypes?: string[]
      featuredOnly?: boolean
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'cycleList'
      title: string
      subtitle?: string
      limit?: number
      featuredOnly?: boolean
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'convocationList'
      title: string
      subtitle?: string
      limit?: number
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'campusList'
      title: string
      subtitle?: string
      limit?: number
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'categoryGrid'
      title: string
      subtitle?: string
      items: Array<{ title: string; image: string; href?: string }>
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'teamGrid'
      title: string
      subtitle?: string
      members: Array<{ name: string; role: string; image: string; href?: string; id?: string | number }>
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'leadForm'
      title: string
      subtitle?: string
      source: string
      dark?: boolean
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'faqList'
      title: string
      subtitle?: string
      limit?: number
      featuredOnly?: boolean
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'testimonialList'
      title: string
      subtitle?: string
      limit?: number
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'formEmbed'
      title: string
      subtitle?: string
      source?: string
      formId?: string
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'blogList'
      title: string
      subtitle?: string
      limit?: number
    }
  | {
      id?: string
      enabled?: boolean
      label?: string
      kind: 'richText'
      title?: string
      body: string
    }

export type CookieBannerVariant = 'bar' | 'modal' | 'corner'

export type WebsiteConsentCategoryId = 'necessary' | 'analytics' | 'marketing_google' | 'marketing_meta'

export type WebsiteConsentStats = {
  shown: number
  analyticsGranted: number
  analyticsDenied: number
  marketingGoogleGranted: number
  marketingGoogleDenied: number
  marketingMetaGranted: number
  marketingMetaDenied: number
}

export type WebsiteConsentConfig = {
  bannerVariant: CookieBannerVariant
  categories: {
    analytics: boolean
    marketing_google: boolean
    marketing_meta: boolean
  }
  googleAdsEnabled?: boolean
  stats?: WebsiteConsentStats
}

export type WebsitePage = {
  title: string
  path: string
  slug?: string
  thumbnailUrl?: string
  pageKind:
    | 'home'
    | 'standard'
    | 'contact'
    | 'faq_index'
    | 'blog_index'
    | 'legal'
    | 'courses_index'
    | 'course_detail_template'
    | 'convocations_index'
    | 'convocation_detail_template'
    | 'cycles_index'
    | 'cycle_detail_template'
    | 'campuses_index'
    | 'campus_detail_template'
    | 'login'
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  sections: WebsiteSection[]
}

export type WebsiteWhatsappChannel = {
  label: string
  phone: string
  shortCode?: string
  message?: string
}

export type WebsiteFooterLocation = {
  label: string
  address: string
}

export type WebsiteFooterBadge = {
  src: string
  alt: string
}

export type WebsiteContact = {
  email: string
  phone: string
  phoneAlternative?: string
  schedule?: string
  whatsapp: WebsiteWhatsappChannel[]
}

export type WebsiteConfig = {
  visualIdentity: {
    logoPrimary: string
    logoMark: string
    favicon: string
    fontPrimary: string
    fontSecondary?: string
    colorPrimary: string
    colorPrimaryDark: string
    colorAccent: string
    colorSurface: string
    colorText: string
  }
  academyName?: string
  legalName?: string
  contact?: WebsiteContact
  navigation: {
    items: WebsiteNavigationItem[]
    cta?: WebsiteLink
  }
  footer: {
    description: string
    columns: Array<{ title: string; links: WebsiteLink[] }>
    locations?: WebsiteFooterLocation[]
    badges?: WebsiteFooterBadge[]
    legalNote?: string
    copyright?: string
  }
  redirects: Array<{ from: string; to: string }>
  pages: WebsitePage[]
  seo?: {
    keywords?: string[]
    concepts?: string[]
  }
  consent?: WebsiteConsentConfig
}

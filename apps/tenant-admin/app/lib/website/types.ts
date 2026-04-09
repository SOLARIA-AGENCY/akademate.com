export type WebsiteLink = {
  label: string
  href: string
}

export type WebsiteHeroSlide = {
  image: string
  alt: string
}

export type WebsiteSection =
  | {
      kind: 'heroCarousel'
      eyebrow?: string
      title: string
      subtitle: string
      slides: WebsiteHeroSlide[]
      primaryCta?: WebsiteLink
      secondaryCta?: WebsiteLink
    }
  | {
      kind: 'statsStrip'
      items: Array<{ value: string; label: string }>
    }
  | {
      kind: 'featureStrip'
      title?: string
      subtitle?: string
      items: Array<{ title: string; description: string; icon?: string }>
    }
  | {
      kind: 'ctaBanner'
      title: string
      body: string
      cta?: WebsiteLink
      theme?: 'brand' | 'dark' | 'light'
    }
  | {
      kind: 'courseList'
      title: string
      subtitle?: string
      limit?: number
      courseTypes?: string[]
      featuredOnly?: boolean
    }
  | {
      kind: 'cycleList'
      title: string
      subtitle?: string
      limit?: number
      featuredOnly?: boolean
    }
  | {
      kind: 'convocationList'
      title: string
      subtitle?: string
      limit?: number
    }
  | {
      kind: 'campusList'
      title: string
      subtitle?: string
      limit?: number
    }
  | {
      kind: 'categoryGrid'
      title: string
      subtitle?: string
      items: Array<{ title: string; image: string; href?: string }>
    }
  | {
      kind: 'teamGrid'
      title: string
      subtitle?: string
      members: Array<{ name: string; role: string; image: string }>
    }
  | {
      kind: 'leadForm'
      title: string
      subtitle?: string
      source: string
      dark?: boolean
    }

export type WebsitePage = {
  title: string
  path: string
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
  seo?: {
    title?: string
    description?: string
  }
  sections: WebsiteSection[]
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
  navigation: {
    items: WebsiteLink[]
    cta?: WebsiteLink
  }
  footer: {
    description: string
    columns: Array<{ title: string; links: WebsiteLink[] }>
    legalNote?: string
  }
  redirects: Array<{ from: string; to: string }>
  pages: WebsitePage[]
}

import { expect, test } from '@playwright/test'

const verticalSlugs = [
  'professional-training',
  'wellness',
  'sports',
  'seasonal',
  'performing-arts',
  'online-cohorts',
  'languages',
  'networks',
] as const

const publicPaths = [
  '/',
  '/features',
  '/pricing',
  '/solutions',
  ...verticalSlugs.map((slug) => `/solutions/${slug}`),
  '/cursos',
  '/sobre-nosotros',
  '/contacto',
  '/download',
  '/blog',
  '/blog/ai-assisted-academy-operations',
  '/news',
  '/news/academy-setup-blueprint-to-live',
  '/legal/privacidad',
  '/legal/terminos',
  '/legal/cookies',
  '/legal/subencargados',
  '/legal/ia',
] as const

test.describe('public EN/ES parity', () => {
  for (const locale of ['en', 'es'] as const) {
    for (const path of publicPaths) {
      test(`${locale}${path} has stable locale SEO and navigation`, async ({ page }) => {
        const localizedPath = `/${locale}${path === '/' ? '' : path}`
        const response = await page.goto(localizedPath)

        expect(response?.status(), localizedPath).toBe(200)
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          `https://akademate.com${localizedPath}`
        )
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
          'href',
          `https://akademate.com/en${path === '/' ? '' : path}`
        )
        await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
          'href',
          `https://akademate.com/es${path === '/' ? '' : path}`
        )
        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
          'href',
          `https://akademate.com/en${path === '/' ? '' : path}`
        )

        const invalidInternalLinks = await page
          .locator('a[href^="/"]')
          .evaluateAll(
            (links, context) =>
              links
                .map((link) => link.getAttribute('href'))
                .filter(
                  (href): href is string =>
                    Boolean(href) &&
                    !href.startsWith(`/${context.locale}`) &&
                    href !== context.languageSwitchPath &&
                    !href.startsWith('/api/') &&
                    !href.startsWith('/_next/')
                ),
            {
              locale,
              languageSwitchPath: `/${locale === 'en' ? 'es' : 'en'}${path === '/' ? '' : path}`,
            }
          )
        expect(invalidInternalLinks, localizedPath).toEqual([])
      })
    }
  }

  test('Spanish conversion surfaces do not fall back to English controls', async ({ page }) => {
    const checks = [
      { path: '/es', forbidden: ['Book a demo', 'Explore every module', 'Compare plans'] },
      {
        path: '/es/features',
        forbidden: ['Complete module catalogue', 'What your team can do', 'Illustrative roadmap'],
      },
      {
        path: '/es/pricing',
        forbidden: ['Included', 'Paid extension', 'Enterprise scope', 'Not included'],
      },
      {
        path: '/es/contacto',
        forbidden: ['Select a topic', 'Send request', 'Start with your goals'],
      },
    ] as const

    for (const { path, forbidden } of checks) {
      await page.goto(path)
      const visibleText = await page.locator('body').innerText()
      for (const sentinel of forbidden)
        expect(visibleText, `${path}: ${sentinel}`).not.toContain(sentinel)
    }
  })
})

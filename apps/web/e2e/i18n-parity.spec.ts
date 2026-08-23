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
  '/legal/aviso-legal',
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
      {
        path: '/es',
        forbidden: [
          'Book a demo',
          'See the product',
          'Compare plans',
          'See the whole academy.',
          'The academy command centre',
          'One workspace for every role.',
          'Turn interest into a confirmed place.',
          'Fill every course',
          'See Akademate on your academy.',
          'EU-hosted. GDPR ready.',
          'Live academy on Akademate',
          'CEP Formación runs offer, enrolment and campus on Akademate',
        ],
      },
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

  test('desktop previews respond to pointer hover while preserving tab semantics', async ({
    page,
  }) => {
    await page.goto('/en')

    const experienceTabs = page.getByRole('tablist', { name: 'Akademate experiences' })
    await experienceTabs.getByRole('tab', { name: 'Teachers' }).hover()
    await expect(experienceTabs.getByRole('tab', { name: 'Teachers' })).toHaveAttribute(
      'aria-selected',
      'true'
    )

    await page.goto('/en/features')
    const distributionTabs = page.getByRole('tablist', { name: 'Website distribution options' })
    await distributionTabs.getByRole('tab', { name: 'Your own domain' }).hover()
    await expect(distributionTabs.getByRole('tab', { name: 'Your own domain' })).toHaveAttribute(
      'aria-selected',
      'true'
    )

    await page.goto('/en/download')
    const appTabs = page.getByRole('tablist', { name: 'Future Akademate applications' })
    await appTabs.getByRole('tab', { name: 'iPhone' }).hover()
    await expect(appTabs.getByRole('tab', { name: 'iPhone' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  test('all 23 Spanish feature modules preview on hover without an internal vertical scroller', async ({
    page,
  }) => {
    test.slow()
    await page.goto('/es/features')
    const catalogue = page.getByTestId('feature-catalogue')
    const tablist = catalogue.getByRole('tablist', { name: 'Módulos de producto de Akademate' })
    const tabs = tablist.getByRole('tab')

    await expect(tabs).toHaveCount(23)
    expect(await tablist.evaluate((node) => getComputedStyle(node).overflowY)).not.toMatch(
      /auto|scroll/
    )

    await tabs.nth(1).hover()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await page.mouse.move(0, 0)

    for (let index = 0; index < 23; index += 1) {
      const tab = tabs.nth(index)
      await tab.evaluate((node) => {
        node.scrollIntoView({ block: 'center' })
        ;(node as HTMLButtonElement).click()
      })
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      await expect(catalogue.getByRole('tabpanel')).toBeVisible()
    }
  })
})

import { expect, test } from '@playwright/test'

test.describe('Akademate public commercial surface', () => {
  test('communicates a growth outcome, real proof and clear conversion', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Run your academy. Grow.')
    await expect(page.getByRole('link', { name: 'Book a demo' }).first()).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: 'One workspace for every role.',
      })
    ).toBeVisible()
    await expect(page.getByRole('tablist', { name: 'Akademate experiences' })).toBeVisible()
    await page.getByRole('tab', { name: 'Teachers' }).click()
    await expect(page.getByRole('tabpanel', { name: 'Teachers' })).toContainText(
      'Private chat and feedback'
    )
    const operations = page.getByTestId('academy-operations-story')
    await expect(
      operations.getByRole('heading', { name: 'Run your academy with clarity.' })
    ).toBeVisible()
    await expect(operations.getByText('Active learners')).toBeVisible()
    await expect(operations.getByText('Academy overview')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Watch your academy take shape.' })).toHaveCount(
      0
    )
    const platform = page.getByTestId('visual-platform-pillars')
    await expect(platform.getByRole('article')).toHaveCount(8)
    await expect(platform.getByRole('img')).toHaveCount(8)
    const campus = page.getByTestId('connected-campus-story')
    await expect(campus.getByRole('heading', { name: /Record every arrival/ })).toBeVisible()
    await expect(campus.getByRole('heading', { name: /live channel/ })).toBeVisible()
    await expect(campus.getByText('Display status 24/7')).toBeVisible()
    const mcp = page.getByTestId('home-mcp-connect')
    await expect(
      mcp.getByRole('heading', { name: 'Connect your AI agent to Akademate.' })
    ).toBeVisible()
    await expect(mcp.getByText('ChatGPT')).toBeVisible()
    await expect(mcp.getByText('Claude')).toBeVisible()
    await expect(mcp.getByText('Grok')).toBeVisible()
    await expect(mcp.getByText('Gemini')).toBeVisible()
    await expect(page.getByText('Built around every academy model')).toBeVisible()
    await expect(page.getByText('Language academies').first()).toBeAttached()
    await expect(page.getByText('Multi-site academy groups').first()).toBeAttached()
    const trustSignals = page.getByRole('region', { name: 'Akademate trust signals' })
    await expect(trustSignals).toBeVisible()
    await expect(trustSignals.getByText('Learner-rated experience')).toBeVisible()
    await expect(trustSignals.getByText('Consent-aware enquiries')).toBeVisible()
    await expect(trustSignals).not.toContainText(/trustpilot/i)
    await expect(
      page.getByRole('heading', { name: 'Let every academy voice be heard.' })
    ).toBeVisible()
    await expect(
      page.getByText('Public learner review presented by CEP Formación').first()
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Launch' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Business', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible()
    await expect(page.getByText('Dedicated or on-premise').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Payments and finance' })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'Blog' })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'News' })).toBeVisible()
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Blog' })).toBeVisible()
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'News' })).toBeVisible()
    for (const network of ['Instagram', 'X', 'Facebook'])
      await expect(page.getByRole('link', { name: `${network}: find Akademate` })).toBeVisible()
  })

  test('serves persistent English and Spanish routes without redirect loops', async ({
    context,
    page,
  }) => {
    const spanish = await page.goto('/es')
    expect(spanish?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Gestiona tu academia. Crece.'
    )
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('link', { name: /ES/ }).first()).toHaveAttribute(
      'aria-current',
      'page'
    )

    const cookies = await context.cookies()
    const localeCookie = cookies.find((cookie) => cookie.name === 'akademate_locale')
    expect(localeCookie?.value).toBe('es')
    expect(localeCookie?.httpOnly).toBe(true)

    await page.getByRole('link', { name: /EN/ }).first().click()
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Run your academy. Grow.')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    for (const path of ['/en/features', '/es/pricing', '/en/solutions', '/es/contacto']) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
    }

    const health = await page.request.get('/api/health')
    expect(health.status()).toBe(200)
    const asset = await page.request.get('/logos/akademate-icon-48.png')
    expect(asset.status()).toBe(200)
  })

  test('publishes a complete feature catalogue, product examples and separate SEO editorial sections', async ({
    page,
  }) => {
    const featuresResponse = await page.goto('/features')
    expect(featuresResponse?.status()).toBe(200)
    const catalogue = page.getByTestId('feature-catalogue')
    await expect(
      catalogue.getByRole('tablist', { name: 'Akademate feature modules' }).getByRole('tab')
    ).toHaveCount(23)
    const featureTabs = catalogue.getByRole('tablist', { name: 'Akademate feature modules' })
    await featureTabs.getByRole('tab').first().focus()
    await page.keyboard.press('ArrowDown')
    await expect(featureTabs.getByRole('tab').nth(1)).toBeFocused()
    await expect(featureTabs.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true')
    await catalogue.getByRole('tab', { name: 'Payments, billing and finance' }).click()
    await expect(
      catalogue
        .getByRole('tabpanel')
        .getByRole('heading', { name: 'Payments, billing and finance' })
    ).toBeVisible()
    await expect(catalogue.getByRole('tabpanel')).toContainText('Stripe')
    await expect(catalogue.getByRole('tabpanel')).toContainText('PayPal')
    await expect(catalogue.getByRole('tabpanel')).toContainText('SEPA')
    await catalogue.getByRole('tab', { name: 'Growth, Ads and CRM' }).click()
    await expect(catalogue.getByRole('tabpanel')).toContainText('Meta')
    await expect(catalogue.getByRole('tabpanel')).toContainText('Google Ads')
    const productExamples = page.getByRole('tablist', { name: 'Akademate product examples' })
    await expect(productExamples).toBeVisible()
    await productExamples.getByRole('tab', { name: 'Payments', exact: true }).click()
    await expect(page.getByLabel('Provider')).toHaveValue('Stripe')
    await expect(page.getByLabel('Payment model')).toHaveValue('3 monthly instalments')

    for (const path of [
      '/blog/ai-assisted-academy-operations',
      '/blog/one-operation-in-person-online-academies',
      '/blog/campaign-click-to-confirmed-place',
      '/news/akademate-expands-sport-wellness-seasonal',
      '/news/academy-setup-blueprint-to-live',
    ]) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      expect(
        await page.locator('article section[id^="section-"] h2').count()
      ).toBeGreaterThanOrEqual(6)
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
    }
    await page.goto('/blog/akademate-expands-sport-wellness-seasonal')
    await expect(page).toHaveURL(/\/news\/akademate-expands-sport-wellness-seasonal$/)
    const missing = await page.goto('/blog/not-a-real-article')
    expect(missing?.status()).toBe(404)
    const missingNews = await page.goto('/news/not-a-real-update')
    expect(missingNews?.status()).toBe(404)
  })

  test('presents governed MCP and paid growth as illustrative, permission-aware workflows', async ({
    page,
  }) => {
    await page.goto('/features#mcp-agentic-operations')
    const examples = page.getByRole('tablist', { name: 'Agentic and growth examples' })
    await expect(examples).toBeVisible()
    await expect(page.getByText('Illustrative roadmap')).toBeVisible()
    await expect(page.getByText('Planned connector')).toHaveCount(4)
    await examples.getByRole('tab', { name: 'Campaign intelligence' }).click()
    await expect(page.locator('#growth-ads-intelligence')).toBeVisible()
    const growthImage = page.getByRole('img', {
      name: 'Academy operator viewing a social course promotion and campaign dashboard',
    })
    await expect
      .poll(() =>
        growthImage.evaluate((node) => {
          const image = node as HTMLImageElement
          return image.complete && image.naturalWidth > 0
        })
      )
      .toBe(true)
    await expect(page.getByText('Illustrative example').first()).toBeVisible()
    await expect(page.getByText('Attributed enrolments')).toBeVisible()
    await expect(page.getByText('Reach').first()).toBeVisible()
    await expect(page.getByText('N/D', { exact: true })).toBeVisible()

    await page.goto('/features#growth-ads-intelligence')
    await expect(page.locator('#growth-ads-intelligence')).toBeVisible()
    await expect(examples.getByRole('tab', { name: 'Campaign intelligence' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect
      .poll(() =>
        page
          .locator('#growth-ads-intelligence')
          .evaluate((node) => Math.round(node.getBoundingClientRect().top))
      )
      .toBeLessThan(160)
  })

  test('publishes honest Coming soon previews for Mac, iPhone and iPad', async ({ page }) => {
    const response = await page.goto('/download')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Akademate on every screen.'
    )
    const apps = page.getByRole('tablist', { name: 'Future Akademate applications' })
    await expect(apps.getByRole('tab')).toHaveCount(3)
    await apps.getByRole('tab', { name: 'Mac', exact: true }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(apps.getByRole('tab', { name: 'iPhone', exact: true })).toBeFocused()
    await expect(apps.getByRole('tab', { name: 'iPhone', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    for (const app of ['Mac', 'iPhone', 'iPad']) {
      await apps.getByRole('tab', { name: app, exact: true }).click()
      await expect(page.getByRole('tabpanel')).toContainText('Coming soon')
      await expect(page.getByRole('tabpanel')).toContainText('Applications are coming soon.')
    }
    await expect(page.getByRole('link', { name: /download now|app store|install/i })).toHaveCount(0)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1)
  })

  test('renders distinct web distribution modes and a complete shareable course journey', async ({
    page,
  }) => {
    await page.goto('/')
    const distribution = page.getByRole('tablist', { name: 'Website distribution options' })
    const distributionPanel = distribution
      .locator('xpath=ancestor::div[contains(@class,"overflow-hidden")][1]')
      .getByRole('tabpanel')
    const panelHeights: number[] = []
    await distribution.getByRole('tab', { name: 'Your Akademate website' }).click()
    await expect(page.getByText('Live CMS')).toBeVisible()
    panelHeights.push(Math.round((await distributionPanel.boundingBox())?.height ?? 0))
    const domainTab = distribution.getByRole('tab', { name: 'Your own domain' })
    await domainTab.click()
    await expect(domainTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('DNS verified')).toBeVisible()
    panelHeights.push(Math.round((await distributionPanel.boundingBox())?.height ?? 0))
    await distribution.getByRole('tab', { name: 'Embeds for any website' }).click()
    await expect(page.getByText('EMBED BUILDER')).toBeVisible()
    panelHeights.push(Math.round((await distributionPanel.boundingBox())?.height ?? 0))
    await distribution.getByRole('tab', { name: 'A page for every offer' }).click()
    await expect(page.getByText('Ready to share')).toBeVisible()
    panelHeights.push(Math.round((await distributionPanel.boundingBox())?.height ?? 0))
    expect(new Set(panelHeights).size).toBe(1)

    const course = page.locator('#reservations')
    await expect(course.getByText('academy.akademate.com/creative-leadership')).toBeVisible()
    await expect(course.getByText('8 places available')).toBeVisible()
    await expect(course.getByText('16 of 24 confirmed')).toBeVisible()
    await expect(
      course.getByLabel('Four example confirmed attendees').getByRole('img')
    ).toHaveCount(4)
    for (const avatar of await course
      .getByLabel('Four example confirmed attendees')
      .getByRole('img')
      .all()) {
      await expect
        .poll(() => avatar.evaluate((image) => (image as HTMLImageElement).naturalWidth))
        .toBeGreaterThanOrEqual(48)
      expect((await avatar.boundingBox())?.width).toBeGreaterThanOrEqual(48)
    }
    await course.getByRole('button', { name: 'Share course' }).click()
    await expect(course.getByRole('dialog', { name: 'Share course' })).toBeVisible()
  })

  test('shows every academy model as a clickable card with complete card borders', async ({
    page,
  }) => {
    await page.goto('/')

    const clientTitle = page.getByText('Built around every academy model')
    await expect(clientTitle).toHaveCSS('text-align', 'center')
    const marqueeTracks = page.locator('.client-marquee-track')
    await expect(marqueeTracks).toHaveCount(2)
    expect(
      await marqueeTracks.evaluateAll((tracks) =>
        tracks.map((track) => Number.parseFloat(getComputedStyle(track).animationDuration))
      )
    ).toEqual([132, 148])
    const firstAcademyName = page.locator('.client-marquee-name').first()
    await firstAcademyName.hover({ force: true })
    await expect(firstAcademyName).toHaveCSS('color', 'rgb(21, 93, 252)')
    await expect
      .poll(() => firstAcademyName.evaluate((node) => getComputedStyle(node).transform))
      .not.toBe('none')
    await expect(marqueeTracks.first()).toHaveCSS('animation-play-state', 'running')

    const solutions = page.locator('#solutions')
    await expect(solutions.getByRole('heading', { name: 'Built around your academy model.' })).toBeVisible()
    await expect(solutions.locator('a[href*="/solutions/"]')).toHaveCount(10)
    await expect(solutions.getByRole('link', { name: /See this academy model/i })).toHaveCount(10)
    await expect(solutions.getByRole('link', { name: /Driving schools/i })).toBeVisible()
    await expect(solutions.getByRole('link', { name: /Coding academies/i })).toBeVisible()

    const distributionCards = page
      .locator('article')
      .filter({ hasText: 'A page for every offer' })
      .last()
      .locator('..')
    const borders = await distributionCards.evaluate((node) => {
      const style = getComputedStyle(node)
      return [style.borderLeftWidth, style.borderRightWidth]
    })
    expect(borders).toEqual(['1px', '1px'])
  })

  test('shows eight or more ecosystem marks per connector pillar and a responsive plan comparison', async ({
    page,
  }) => {
    await page.goto('/features')
    for (const pillar of ['Payments', 'Finance', 'Growth', 'Communication']) {
      const article = page
        .getByRole('heading', { name: pillar, exact: true })
        .locator('xpath=ancestor::article[1]')
      await expect(article.locator('[title]')).toHaveCount(pillar === 'Payments' ? 9 : 8)
    }

    await page.goto('/pricing')
    await expect(page.getByRole('heading', { name: 'Compare every plan.' })).toBeVisible()
    await expect(page.getByRole('table')).toContainText('Website, catalogue and enrolment')
    await expect(page.getByRole('table')).toContainText('Payments and financial control')
    expect(await page.getByRole('table').getByLabel('Included').count()).toBeGreaterThan(40)
    const signageRow = page.getByRole('row').filter({ hasText: 'Digital Signage' })
    await expect(signageRow.getByText('Paid extension')).toHaveCount(3)
    const extensions = page.getByTestId('pricing-paid-extensions')
    await expect(extensions.getByRole('article')).toHaveCount(8)
    await expect(
      extensions.getByRole('heading', { name: 'Attendance and physical access' })
    ).toBeVisible()
    await expect(extensions.getByRole('heading', { name: 'Digital Signage' })).toBeVisible()
    await expect(page.getByTestId('pricing-separate-costs')).toContainText(
      'Access-control hardware, cards, readers, sensors and installation'
    )
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await expect(page.getByText('Website, catalogue and enrolment').last()).toBeVisible()
    const paidOperations = page
      .locator('details')
      .filter({ hasText: 'Paid operational extensions' })
    await paidOperations.getByText('Paid operational extensions').click()
    await expect(paidOperations.getByText('Digital Signage')).toBeVisible()
    await expect(paidOperations.getByText('Paid extension')).toHaveCount(24)
  })

  test('mobile navigation is keyboard-operable without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Open menu' })
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pricing' }).first()).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('commercial copy stays within a two-line visual budget', async ({ page }) => {
    test.setTimeout(60_000)
    const paths = [
      '/',
      '/features',
      '/pricing',
      '/download',
      '/solutions',
      '/solutions/professional-training',
      '/solutions/languages',
      '/solutions/wellness',
      '/solutions/sports',
      '/solutions/seasonal',
      '/solutions/performing-arts',
      '/solutions/online-cohorts',
      '/solutions/driving-schools',
      '/solutions/coding-academies',
      '/solutions/networks',
      '/blog',
      '/news',
      '/sobre-nosotros',
      '/contacto',
      '/cursos',
    ]

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 1100 },
    ]) {
      await page.setViewportSize(viewport)
      for (const path of paths) {
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        const offenders = await page
          .locator(
            '.marketing-page main p, .marketing-page main h1, .marketing-page main h2, .marketing-page main h3'
          )
          .evaluateAll((nodes) =>
            nodes.flatMap((node) => {
              const style = getComputedStyle(node)
              const lineHeight = Number.parseFloat(style.lineHeight)
              if (!lineHeight || node.getBoundingClientRect().height === 0) return []
              const lines = node.getBoundingClientRect().height / lineHeight
              return lines > 2.15
                ? [{ lines, text: node.textContent?.trim().replace(/\s+/g, ' ').slice(0, 90) }]
                : []
            })
          )
        expect(
          offenders,
          `${path} at ${viewport.width}px contains text blocks over two lines`
        ).toEqual([])
      }
    }
  })

  test('legal routes and visual governance marks resolve without unsupported claims', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(
      page.getByText(
        /framework references shaping our privacy, security and responsible AI roadmap/i
      )
    ).toBeVisible()
    await expect(page.getByLabel(/framework mark$/)).toHaveCount(5)
    for (const paragraph of await page
      .getByRole('heading', { name: 'Grow with confidence.' })
      .locator('xpath=ancestor::section[1]')
      .locator('article p:last-child')
      .all()) {
      const clipping = await paragraph.evaluate((node) => {
        const style = getComputedStyle(node)
        return {
          lineClamp: style.getPropertyValue('-webkit-line-clamp'),
          clipped: node.scrollHeight > node.clientHeight + 1,
        }
      })
      expect(clipping).toEqual({ lineClamp: 'none', clipped: false })
    }
    await expect(page.getByRole('img', { name: 'GDPR' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'EU Artificial Intelligence Act' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/certified by|official seal|approved by/i)
    for (const path of [
      '/legal/privacidad',
      '/legal/terminos',
      '/legal/cookies',
      '/legal/subencargados',
      '/legal/ia',
    ]) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(
        page.getByText(/Working legal information under professional review/i).first()
      ).toBeVisible()
    }
  })

  test('publishes a customer-type index and a complete page for every vertical', async ({
    page,
  }) => {
    const paths = [
      '/en/solutions/professional-training',
      '/en/solutions/wellness',
      '/en/solutions/sports',
      '/en/solutions/seasonal',
      '/en/solutions/performing-arts',
      '/en/solutions/online-cohorts',
      '/en/solutions/languages',
      '/en/solutions/driving-schools',
      '/en/solutions/coding-academies',
      '/en/solutions/networks',
    ]
    const response = await page.goto('/en/solutions', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Your academy. One platform.'
    )
    await expect(page.locator('main a[href^="/en/solutions/"]')).toHaveCount(10)
    const verticalImages = page.locator('main a[href^="/en/solutions/"] img')
    await expect(verticalImages).toHaveCount(10)
    for (let index = 0; index < (await verticalImages.count()); index += 1) {
      const image = verticalImages.nth(index)
      await image.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center' }))
      await expect
        .poll(
          () =>
            image.evaluate((node) => {
              const imageNode = node as HTMLImageElement
              return imageNode.complete && imageNode.naturalWidth > 0
            }),
          { timeout: 15_000 }
        )
        .toBe(true)
    }

    const headings = new Set<string>()
    for (const path of paths) {
      const verticalResponse = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(verticalResponse?.status()).toBe(200)
      const heading = (await page.getByRole('heading', { level: 1 }).textContent())?.trim() ?? ''
      expect(heading.length).toBeGreaterThan(20)
      headings.add(heading)
      await expect(page.getByRole('tablist', { name: /Akademate designed for this/ })).toBeVisible()
      await page.getByRole('tab').last().click()
      await expect(page.getByRole('tabpanel').locator('select')).toHaveCount(3)
      await expect(page.getByRole('link', { name: /Start free trial/i }).first()).toHaveAttribute(
        'href',
        new RegExp(`/registro\\?asunto=trial&vertical=${path.split('/').pop()}$`)
      )
    }
    expect(headings.size).toBe(paths.length)
  })

  test('does not request third-party analytics or marketing', async ({ page }) => {
    const trackerRequests: string[] = []
    page.on('request', (request) => {
      if (
        /google-analytics|googletagmanager|facebook\.net|hotjar|clarity\.ms|segment\.com/i.test(
          request.url()
        )
      )
        trackerRequests.push(request.url())
    })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible()
    await page.waitForTimeout(1_000)
    expect(trackerRequests).toEqual([])
  })

  test('loads every marketing image when its card enters the viewport', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const images = page.locator('main img[alt]:not([alt=""]):visible')
    const count = await images.count()
    expect(count).toBeGreaterThanOrEqual(10)

    for (let index = 0; index < count; index += 1) {
      const image = images.nth(index)
      const alt = (await image.getAttribute('alt')) ?? 'missing alt'
      const source = (await image.getAttribute('src')) ?? 'lazy source not assigned'
      await image.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center' }))
      await expect
        .poll(
          () =>
            image.evaluate((node) => {
              const imageNode = node as HTMLImageElement
              return imageNode.complete && imageNode.naturalWidth > 0
            }),
          { timeout: 15_000, message: `image ${index} (${alt}) failed to load from ${source}` }
        )
        .toBe(true)
      await expect(image).toHaveAttribute('alt', /.+/)
    }
  })

  test('all internal links on commercial pages resolve without dead routes or fragments', async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000)
    for (const sourcePath of ['/', '/features', '/pricing', '/solutions', '/blog', '/news']) {
      await page.goto(sourcePath, { waitUntil: 'domcontentloaded' })
      const hrefs = await page
        .locator('a[href]')
        .evaluateAll(
          (links) => links.map((link) => link.getAttribute('href')).filter(Boolean) as string[]
        )

      for (const href of [...new Set(hrefs)]) {
        if (href.startsWith('mailto:') || href.startsWith('http')) continue
        const [path, fragment] = href.split('#')
        if (fragment && (!path || path === '/' || path === sourcePath)) {
          const targetPath = path || sourcePath
          if (targetPath !== sourcePath)
            await page.goto(targetPath, { waitUntil: 'domcontentloaded' })
          await expect(page.locator(`#${fragment}`)).toHaveCount(1)
          if (targetPath !== sourcePath)
            await page.goto(sourcePath, { waitUntil: 'domcontentloaded' })
          continue
        }

        const response = await request.get(path || sourcePath)
        expect(response.status(), `${sourcePath} links to ${href}`).toBeLessThan(400)
      }
    }
  })

  test('key commercial routes load without failed assets or console errors', async ({ page }) => {
    const failures: string[] = []
    page.on('requestfailed', (request) => {
      const errorText = request.failure()?.errorText
      const navigationCancelled = errorText === 'net::ERR_ABORTED'
      if (!request.url().includes('_rsc=') && !navigationCancelled) {
        failures.push(`request:${errorText ?? 'unknown'}:${request.url()}`)
      }
    })
    page.on('response', (response) => {
      if (response.status() >= 400) failures.push(`response:${response.status()}:${response.url()}`)
    })
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console:${message.text()}`)
    })
    for (const path of [
      '/',
      '/features',
      '/pricing',
      '/download',
      '/solutions',
      '/blog',
      '/news',
      '/blog/campaign-click-to-confirmed-place',
      '/news/akademate-expands-sport-wellness-seasonal',
      '/news/academy-setup-blueprint-to-live',
      '/sobre-nosotros',
      '/contacto',
    ]) {
      const response = await page.goto(path, { waitUntil: 'load' })
      expect(response?.status()).toBe(200)
      await expect(page.locator('main')).toBeVisible()
      await page.waitForTimeout(100)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${path} has horizontal overflow`).toBeLessThanOrEqual(1)
    }
    expect(failures).toEqual([])
  })

  test('contact stays fail-closed until explicit privacy consent', async ({ page }) => {
    let postCount = 0
    await page.route('**/api/leads', async (route) => {
      postCount += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })
    await page.goto('/contacto?asunto=demo')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/Full name/).fill('Ada Lovelace')
    await page.getByLabel(/Email/).fill('ada@example.com')
    await page.getByLabel(/What would you like to discuss/).selectOption('demo')
    await page
      .getByLabel(/Tell us about your academy/)
      .fill('We need to connect in-person and online delivery across two locations.')
    await page.getByRole('button', { name: 'Send request' }).click()
    expect(postCount).toBe(0)
    await expect(
      page.getByText('Please accept the privacy policy before sending your request.')
    ).toBeVisible()
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Send request' }).click()
    await expect(page.getByRole('status')).toContainText('request has been received')
    expect(postCount).toBe(1)
  })
})

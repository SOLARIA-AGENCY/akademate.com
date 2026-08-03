import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const url = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_URL
const outputDirectory = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_OUTPUT
const authToken = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_AUTH_TOKEN
if (!url || !outputDirectory || !authToken) throw new Error('QA URL, output directory and auth token are required')
const qaUrl = new URL(url)
const origin = qaUrl.origin
const dashboardUrl = new URL(origin)
dashboardUrl.hostname = 'localhost'
const dashboardOrigin = dashboardUrl.origin
await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--no-proxy-server'],
})
const consoleErrors = []
const failedRequests = []
let abortedRequests = 0
const trackerRequests = []
const submissionStatuses = []

function observe(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText === 'net::ERR_ABORTED') {
      abortedRequests += 1
      return
    }
    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`)
  })
  page.on('request', (request) => {
    if (/google-analytics|googletagmanager|facebook\.com\/tr|connect\.facebook\.net/i.test(request.url())) {
      trackerRequests.push(request.url())
    }
  })
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await desktop.newPage()
  observe(page)
  const documentResponse = await page.goto(url, { waitUntil: 'networkidle' })
  assert.equal(documentResponse?.status(), 200)
  await page.getByRole('heading', { level: 1, name: 'Applied Learning Lab' }).waitFor()
  await page.getByRole('form', { name: 'Course request' }).waitFor()
  await page.screenshot({ path: `${outputDirectory}/desktop-form.png`, fullPage: true })

  await page.getByLabel('First name').fill('Ada')
  await page.getByLabel('Last name').fill('Lovelace')
  await page.getByLabel('Email').fill('ada.browser@example.test')
  await page.getByLabel(/I agree to the privacy notice/i).check()
  const submissionResponse = page.waitForResponse((response) => (
    response.url().includes('/submissions') && response.request().method() === 'POST'
  ))
  await page.getByRole('button', { name: 'Send application' }).click()
  submissionStatuses.push((await submissionResponse).status())
  await page.getByText('Your application has been received for review.').waitFor()
  await page.screenshot({ path: `${outputDirectory}/desktop-success.png`, fullPage: true })
  await desktop.close()

  const inboxDesktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await inboxDesktop.addCookies([{
    name: 'akademate_next_session',
    value: authToken,
    url: dashboardOrigin,
    httpOnly: true,
    sameSite: 'Lax',
  }])
  const inboxPage = await inboxDesktop.newPage()
  observe(inboxPage)
  const inboxApiStatuses = []
  inboxPage.on('response', (response) => {
    if (response.url().includes('/api/next/offer-submissions') && response.request().method() === 'GET') {
      inboxApiStatuses.push(response.status())
    }
  })
  const inboxDocument = await inboxPage.goto(`${dashboardOrigin}/dashboard/cursos/solicitudes`, { waitUntil: 'domcontentloaded' })
  assert.equal(inboxDocument?.status(), 200)
  try {
    await inboxPage.getByRole('heading', { level: 1, name: 'Solicitudes de cursos' }).waitFor({ timeout: 10_000 })
  } catch (error) {
    await inboxPage.screenshot({ path: `${outputDirectory}/desktop-inbox-failure.png`, fullPage: true })
    const body = (await inboxPage.locator('body').innerText()).slice(0, 1000)
    throw new Error(`Inbox page unavailable at ${inboxPage.url()}: ${body}`, { cause: error })
  }
  await inboxPage.getByText('Ada Lovelace', { exact: true }).filter({ visible: true }).waitFor()
  await inboxPage.getByText('Pendiente de revisión', { exact: true }).filter({ visible: true }).first().waitFor()
  assert.deepEqual(inboxApiStatuses, [200])
  assert.equal(inboxPage.url(), `${dashboardOrigin}/dashboard/cursos/solicitudes`)
  await inboxPage.screenshot({ path: `${outputDirectory}/desktop-inbox.png`, fullPage: true })
  await inboxDesktop.close()

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobile.newPage()
  observe(mobilePage)
  assert.equal((await mobilePage.goto(url, { waitUntil: 'networkidle' }))?.status(), 200)
  await mobilePage.getByRole('form', { name: 'Course request' }).waitFor()
  await mobilePage.screenshot({ path: `${outputDirectory}/mobile-form.png`, fullPage: true })
  assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await mobile.close()

  const inboxMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  await inboxMobile.addCookies([{
    name: 'akademate_next_session',
    value: authToken,
    url: dashboardOrigin,
    httpOnly: true,
    sameSite: 'Lax',
  }])
  const inboxMobilePage = await inboxMobile.newPage()
  observe(inboxMobilePage)
  assert.equal((await inboxMobilePage.goto(`${dashboardOrigin}/dashboard/cursos/solicitudes`, { waitUntil: 'domcontentloaded' }))?.status(), 200)
  await inboxMobilePage.getByRole('heading', { level: 1, name: 'Solicitudes de cursos' }).waitFor()
  await inboxMobilePage.getByText('Ada Lovelace', { exact: true }).filter({ visible: true }).waitFor()
  assert.equal(await inboxMobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  const mobileMain = inboxMobilePage.locator('main').first()
  assert.equal(await mobileMain.evaluate((element) => element.scrollWidth <= element.clientWidth), true)
  await inboxMobilePage.screenshot({ path: `${outputDirectory}/mobile-inbox.png`, fullPage: true })
  await inboxMobilePage.getByText('Ada Lovelace', { exact: true }).filter({ visible: true }).scrollIntoViewIfNeeded()
  await inboxMobilePage.screenshot({ path: `${outputDirectory}/mobile-inbox-list.png`, fullPage: true })
  await inboxMobile.close()

  assert.deepEqual(submissionStatuses, [201])
  assert.deepEqual(consoleErrors, [])
  assert.deepEqual(failedRequests, [])
  assert.deepEqual(trackerRequests, [])
  process.stdout.write(`${JSON.stringify({
    desktop: '1440x1000',
    mobile: '390x844',
    submissionStatus: 201,
    consoleErrors: 0,
    failedRequests: 0,
    abortedPrefetchRequests: abortedRequests,
    trackerRequests: 0,
    horizontalOverflow: false,
    authenticatedInboxStatus: 200,
    screenshots: ['desktop-form.png', 'desktop-success.png', 'desktop-inbox.png', 'mobile-form.png', 'mobile-inbox.png', 'mobile-inbox-list.png'],
  })}\n`)
} finally {
  await browser.close()
}

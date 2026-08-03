import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const url = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_URL
const outputDirectory = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_OUTPUT
if (!url || !outputDirectory) throw new Error('QA URL and output directory are required')
await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--no-proxy-server'],
})
const consoleErrors = []
const failedRequests = []
const trackerRequests = []
const submissionStatuses = []

function observe(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`))
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
    trackerRequests: 0,
    horizontalOverflow: false,
    screenshots: ['desktop-form.png', 'desktop-success.png', 'mobile-form.png'],
  })}\n`)
} finally {
  await browser.close()
}

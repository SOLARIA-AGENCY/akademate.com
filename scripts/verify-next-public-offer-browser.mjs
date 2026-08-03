import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const url = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_URL
const outputDirectory = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_OUTPUT
const authToken = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_AUTH_TOKEN
const paidUrl = process.env.AKADEMATE_NEXT_PUBLIC_OFFER_QA_PAID_URL
if (!url || !paidUrl || !outputDirectory || !authToken)
  throw new Error('QA URLs, output directory and auth token are required')
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
const decisionStatuses = []
const historyStatuses = []
const enrollmentStatuses = []
const cancellationStatuses = []
const checkoutStatuses = []
const dashboardHttpErrors = []

function observeDashboardHttp(page, viewport) {
  page.on('response', (response) => {
    if (response.status() < 400) return
    const request = response.request()
    dashboardHttpErrors.push(
      `${viewport} ${response.status()} ${request.method()} ${response.url()}`
    )
  })
}

function observe(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText === 'net::ERR_ABORTED') {
      abortedRequests += 1
      return
    }
    failedRequests.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`
    )
  })
  page.on('request', (request) => {
    if (
      /google-analytics|googletagmanager|facebook\.com\/tr|connect\.facebook\.net/i.test(
        request.url()
      )
    ) {
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
  const submissionResponse = page.waitForResponse(
    (response) => response.url().includes('/submissions') && response.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'Send application' }).click()
  submissionStatuses.push((await submissionResponse).status())
  await page.getByText('Your application has been received for review.').waitFor()
  await page.screenshot({ path: `${outputDirectory}/desktop-success.png`, fullPage: true })
  await desktop.close()

  const paidDesktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const paidPage = await paidDesktop.newPage()
  observe(paidPage)
  let checkoutPayload = null
  await paidPage.route('**/api/next/public/offers/*/checkout', async (route) => {
    checkoutPayload = JSON.parse(route.request().postData() ?? '{}')
    checkoutStatuses.push(201)
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
        status: 'awaiting_payment',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_browser',
      }),
    })
  })
  await paidPage.route('https://checkout.stripe.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Secure checkout test destination</title><h1>Secure checkout test destination</h1>',
    })
  )
  assert.equal((await paidPage.goto(paidUrl, { waitUntil: 'networkidle' }))?.status(), 200)
  await paidPage.getByRole('form', { name: 'Paid course registration' }).waitFor()
  await paidPage.screenshot({ path: `${outputDirectory}/desktop-paid-form.png`, fullPage: true })
  await paidPage.getByLabel('First name').fill('Ada')
  await paidPage.getByLabel('Last name').fill('Lovelace')
  await paidPage.getByLabel('Email').fill('ada.paid.browser@example.test')
  await paidPage
    .getByRole('checkbox', { name: /privacy notice for registration and payment/i })
    .check()
  await paidPage.getByRole('button', { name: 'Continue to secure payment' }).click()
  await paidPage.getByRole('heading', { name: 'Secure checkout test destination' }).waitFor()
  assert.equal(checkoutPayload.amountCents, undefined)
  assert.equal(checkoutPayload.tenantId, undefined)
  assert.equal(checkoutPayload.paymentMethod, 'card_or_wallet')
  await paidPage.screenshot({
    path: `${outputDirectory}/desktop-paid-checkout-redirect.png`,
    fullPage: true,
  })
  await paidDesktop.close()

  const inboxDesktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await inboxDesktop.addCookies([
    {
      name: 'akademate_next_session',
      value: authToken,
      url: dashboardOrigin,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
  const inboxPage = await inboxDesktop.newPage()
  observe(inboxPage)
  observeDashboardHttp(inboxPage, 'desktop')
  const inboxApiStatuses = []
  inboxPage.on('response', (response) => {
    if (
      response.url().includes('/api/next/offer-submissions') &&
      response.request().method() === 'GET'
    ) {
      inboxApiStatuses.push(response.status())
    }
  })
  const dashboardDocument = await inboxPage.goto(`${dashboardOrigin}/dashboard`, {
    waitUntil: 'domcontentloaded',
  })
  assert.equal(dashboardDocument?.status(), 200)
  await inboxPage.getByRole('heading', { level: 1, name: 'Dashboard' }).waitFor({ timeout: 15_000 })
  await inboxPage.getByText('Solicitudes pendientes', { exact: true }).waitFor({ timeout: 15_000 })
  assert.equal(
    await inboxPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true
  )
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-dashboard-baseline.png`,
    fullPage: true,
  })
  const inboxDocument = await inboxPage.goto(`${dashboardOrigin}/dashboard/cursos/solicitudes`, {
    waitUntil: 'domcontentloaded',
  })
  assert.equal(inboxDocument?.status(), 200)
  try {
    await inboxPage
      .getByRole('heading', { level: 1, name: 'Solicitudes de cursos' })
      .waitFor({ timeout: 10_000 })
  } catch (error) {
    await inboxPage.screenshot({
      path: `${outputDirectory}/desktop-inbox-failure.png`,
      fullPage: true,
    })
    const body = (await inboxPage.locator('body').innerText()).slice(0, 1000)
    throw new Error(`Inbox page unavailable at ${inboxPage.url()}: ${body}`, { cause: error })
  }
  await inboxPage.getByText('Ada Lovelace', { exact: true }).filter({ visible: true }).waitFor()
  await inboxPage
    .getByText('Pendiente de revisión', { exact: true })
    .filter({ visible: true })
    .first()
    .waitFor()
  assert.deepEqual(inboxApiStatuses, [200])
  assert.equal(inboxPage.url(), `${dashboardOrigin}/dashboard/cursos/solicitudes`)
  await inboxPage.screenshot({ path: `${outputDirectory}/desktop-inbox.png`, fullPage: true })
  await inboxPage.getByRole('button', { name: 'Aprobar' }).filter({ visible: true }).first().click()
  await inboxPage.getByText('Esta decisión no crea matrícula, plaza ni cobro.').waitFor()
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-inbox-decision.png`,
    fullPage: true,
  })
  await inboxPage.getByLabel('Nota interna (opcional)').fill('Verified by the admissions manager')
  const decisionResponse = inboxPage.waitForResponse(
    (response) => response.url().includes('/decision') && response.request().method() === 'PATCH'
  )
  await inboxPage.getByRole('button', { name: 'Confirmar: Aprobada' }).click()
  decisionStatuses.push((await decisionResponse).status())
  await inboxPage.getByText('Solicitud actualizada: aprobada.').waitFor()
  await inboxPage.getByText('Aprobada', { exact: true }).filter({ visible: true }).first().waitFor()
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-inbox-approved.png`,
    fullPage: true,
  })
  const historyResponse = inboxPage.waitForResponse(
    (response) => response.url().includes('/reviews') && response.request().method() === 'GET'
  )
  await inboxPage
    .getByRole('button', { name: 'Historial' })
    .filter({ visible: true })
    .first()
    .click()
  historyStatuses.push((await historyResponse).status())
  await inboxPage.getByText('Historial de Ada Lovelace').waitFor()
  await inboxPage.getByText('Verified by the admissions manager').waitFor()
  await inboxPage.getByText(/QA Manager · actor #/).waitFor()
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-inbox-history.png`,
    fullPage: true,
  })
  await inboxPage.getByRole('button', { name: 'Cerrar historial' }).click()
  await inboxPage
    .getByRole('button', { name: 'Crear matrícula' })
    .filter({ visible: true })
    .first()
    .click()
  await inboxPage.getByText(/reservará una plaza/i).waitFor()
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-inbox-enrollment-confirmation.png`,
    fullPage: true,
  })
  const enrollmentResponse = inboxPage.waitForResponse(
    (response) => response.url().includes('/enrollment') && response.request().method() === 'POST'
  )
  await inboxPage.getByRole('button', { name: 'Confirmar matrícula' }).click()
  const completedEnrollmentResponse = await enrollmentResponse
  enrollmentStatuses.push(completedEnrollmentResponse.status())
  const enrollmentResult = await completedEnrollmentResponse.json()
  assert.match(String(enrollmentResult.enrollmentId), /^[1-9]\d*$/)
  await inboxPage.getByText('Matrícula confirmada y plaza reservada.').waitFor()
  await inboxPage
    .getByRole('link', { name: 'Ver matrícula' })
    .filter({ visible: true })
    .first()
    .waitFor()
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-inbox-enrolled.png`,
    fullPage: true,
  })
  const enrollmentHref = await inboxPage
    .getByRole('link', { name: 'Ver matrícula' })
    .filter({ visible: true })
    .first()
    .getAttribute('href')
  assert.equal(enrollmentHref, `/matriculas/${enrollmentResult.enrollmentId}`)
  assert.equal(
    (
      await inboxPage.goto(`${dashboardOrigin}${enrollmentHref}`, { waitUntil: 'domcontentloaded' })
    )?.status(),
    200
  )
  await inboxPage
    .getByText(`Matrícula #${enrollmentResult.enrollmentId}`, { exact: true })
    .first()
    .waitFor()
  await inboxPage.getByRole('button', { name: 'Gestionar baja' }).waitFor()
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-enrollment-detail.png`,
    fullPage: true,
  })
  await inboxPage.getByRole('button', { name: 'Gestionar baja' }).click()
  await inboxPage.getByText(/Los pagos no se modificarán/i).waitFor()
  await inboxPage
    .getByLabel('Motivo auditado')
    .fill('Baja solicitada durante la verificación operativa')
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-enrollment-cancellation-confirmation.png`,
    fullPage: true,
  })
  const cancellationResponsePromise = inboxPage.waitForResponse(
    (response) => response.url().includes('/cancel') && response.request().method() === 'POST'
  )
  await inboxPage.getByRole('button', { name: 'Confirmar baja' }).click()
  const cancellationResponse = await cancellationResponsePromise
  const cancellationStatus = cancellationResponse.status()
  const cancellationBody = await cancellationResponse.text().catch(() => '<unreadable response>')
  cancellationStatuses.push(cancellationStatus)
  if (cancellationStatus !== 200) {
    await inboxPage.screenshot({
      path: `${outputDirectory}/desktop-enrollment-cancellation-failure.png`,
      fullPage: true,
    })
    throw new Error(`Enrollment cancellation failed (${cancellationStatus}): ${cancellationBody}`)
  }
  await inboxPage.getByText('La matrícula se ha actualizado como baja voluntaria.').waitFor()
  await inboxPage.getByText('La primera persona en lista de espera ha recibido la plaza.').waitFor()
  await inboxPage.screenshot({
    path: `${outputDirectory}/desktop-enrollment-cancelled.png`,
    fullPage: true,
  })
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
  assert.equal(
    await mobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true
  )
  await mobile.close()

  const paidMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  const paidMobilePage = await paidMobile.newPage()
  observe(paidMobilePage)
  assert.equal((await paidMobilePage.goto(paidUrl, { waitUntil: 'networkidle' }))?.status(), 200)
  await paidMobilePage.getByRole('form', { name: 'Paid course registration' }).waitFor()
  assert.equal(
    await paidMobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true
  )
  await paidMobilePage.screenshot({
    path: `${outputDirectory}/mobile-paid-form.png`,
    fullPage: true,
  })
  await paidMobile.close()

  const inboxMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  await inboxMobile.addCookies([
    {
      name: 'akademate_next_session',
      value: authToken,
      url: dashboardOrigin,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
  const inboxMobilePage = await inboxMobile.newPage()
  observe(inboxMobilePage)
  observeDashboardHttp(inboxMobilePage, 'mobile')
  assert.equal(
    (
      await inboxMobilePage.goto(`${dashboardOrigin}/dashboard`, { waitUntil: 'domcontentloaded' })
    )?.status(),
    200
  )
  await inboxMobilePage
    .getByRole('heading', { level: 1, name: 'Dashboard' })
    .waitFor({ timeout: 15_000 })
  await inboxMobilePage
    .getByText('Solicitudes pendientes', { exact: true })
    .waitFor({ timeout: 15_000 })
  assert.equal(
    await inboxMobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true
  )
  await inboxMobilePage.screenshot({
    path: `${outputDirectory}/mobile-dashboard-baseline.png`,
    fullPage: true,
  })
  const mobileDashboardMain = inboxMobilePage.locator('main').first()
  const mobilePriorities = inboxMobilePage.getByRole('heading', { name: 'Atención operativa' })
  await mobilePriorities.scrollIntoViewIfNeeded()
  await mobilePriorities.waitFor({ state: 'visible' })
  await inboxMobilePage.screenshot({ path: `${outputDirectory}/mobile-dashboard-priorities.png` })
  const mobileProgramming = inboxMobilePage.getByRole('heading', { name: 'Próximas convocatorias' })
  await mobileProgramming.scrollIntoViewIfNeeded()
  await mobileProgramming.waitFor({ state: 'visible' })
  await inboxMobilePage.screenshot({ path: `${outputDirectory}/mobile-dashboard-programming.png` })
  const mobileActivity = inboxMobilePage.getByRole('heading', { name: 'Actividad reciente' })
  await mobileActivity.scrollIntoViewIfNeeded()
  await mobileActivity.waitFor({ state: 'visible' })
  await inboxMobilePage.screenshot({ path: `${outputDirectory}/mobile-dashboard-activity.png` })
  await inboxMobilePage.getByText('AKADEMATE WORKSPACE').scrollIntoViewIfNeeded()
  await inboxMobilePage.getByText('AKADEMATE WORKSPACE').waitFor({ state: 'visible' })
  assert.equal(
    await mobileDashboardMain.evaluate((element) => element.scrollWidth <= element.clientWidth),
    true
  )
  await inboxMobilePage.screenshot({ path: `${outputDirectory}/mobile-dashboard-footer.png` })
  assert.equal(
    (
      await inboxMobilePage.goto(`${dashboardOrigin}/dashboard/cursos/solicitudes`, {
        waitUntil: 'domcontentloaded',
      })
    )?.status(),
    200
  )
  await inboxMobilePage.getByRole('heading', { level: 1, name: 'Solicitudes de cursos' }).waitFor()
  await inboxMobilePage
    .getByText('Ada Lovelace', { exact: true })
    .filter({ visible: true })
    .waitFor()
  await inboxMobilePage
    .getByRole('link', { name: 'Ver matrícula' })
    .filter({ visible: true })
    .first()
    .waitFor()
  await inboxMobilePage
    .getByText('Baja voluntaria', { exact: true })
    .filter({ visible: true })
    .first()
    .waitFor()
  assert.equal(
    await inboxMobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true
  )
  const mobileMain = inboxMobilePage.locator('main').first()
  assert.equal(
    await mobileMain.evaluate((element) => element.scrollWidth <= element.clientWidth),
    true
  )
  await inboxMobilePage.screenshot({ path: `${outputDirectory}/mobile-inbox.png`, fullPage: true })
  await inboxMobilePage
    .getByText('Ada Lovelace', { exact: true })
    .filter({ visible: true })
    .scrollIntoViewIfNeeded()
  await inboxMobilePage.screenshot({
    path: `${outputDirectory}/mobile-inbox-list.png`,
    fullPage: true,
  })
  const mobileHistoryResponse = inboxMobilePage.waitForResponse(
    (response) => response.url().includes('/reviews') && response.request().method() === 'GET'
  )
  await inboxMobilePage
    .getByRole('button', { name: 'Historial' })
    .filter({ visible: true })
    .first()
    .click()
  historyStatuses.push((await mobileHistoryResponse).status())
  const mobileHistory = inboxMobilePage.getByText('Historial de Ada Lovelace')
  await mobileHistory.waitFor()
  await mobileHistory.scrollIntoViewIfNeeded()
  await inboxMobilePage.screenshot({
    path: `${outputDirectory}/mobile-inbox-history.png`,
    fullPage: true,
  })
  await inboxMobile.close()

  const enrollmentMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  await enrollmentMobile.addCookies([
    {
      name: 'akademate_next_session',
      value: authToken,
      url: dashboardOrigin,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
  const enrollmentMobilePage = await enrollmentMobile.newPage()
  observe(enrollmentMobilePage)
  const mobileEnrollmentDetailResponsePromise = enrollmentMobilePage.waitForResponse(
    (response) =>
      response.url().includes(`/api/next/enrollments/${enrollmentResult.enrollmentId}`) &&
      response.request().method() === 'GET'
  )
  assert.equal(
    (
      await enrollmentMobilePage.goto(
        `${dashboardOrigin}/matriculas/${enrollmentResult.enrollmentId}`,
        { waitUntil: 'domcontentloaded' }
      )
    )?.status(),
    200
  )
  const mobileEnrollmentDetailResponse = await mobileEnrollmentDetailResponsePromise
  const mobileEnrollmentDetailStatus = mobileEnrollmentDetailResponse.status()
  const mobileEnrollmentDetailBody = await mobileEnrollmentDetailResponse
    .text()
    .catch(() => '<unreadable response>')
  if (mobileEnrollmentDetailStatus !== 200) {
    await enrollmentMobilePage.screenshot({
      path: `${outputDirectory}/mobile-enrollment-detail-failure.png`,
      fullPage: true,
    })
    throw new Error(
      `Mobile enrollment detail failed (${mobileEnrollmentDetailStatus}): ${mobileEnrollmentDetailBody}`
    )
  }
  await enrollmentMobilePage.screenshot({
    path: `${outputDirectory}/mobile-enrollment-detail-loaded.png`,
    fullPage: true,
  })
  const mobileLifecycleStatus = enrollmentMobilePage.getByText(
    /Estado matrícula:\s*Baja voluntaria/
  )
  await mobileLifecycleStatus.waitFor({ state: 'attached' })
  await mobileLifecycleStatus.scrollIntoViewIfNeeded()
  await mobileLifecycleStatus.waitFor({ state: 'visible' })
  assert.equal(
    await enrollmentMobilePage.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    ),
    true
  )
  await enrollmentMobilePage.screenshot({
    path: `${outputDirectory}/mobile-enrollment-cancelled.png`,
    fullPage: true,
  })
  await enrollmentMobile.close()

  assert.deepEqual(submissionStatuses, [201])
  assert.deepEqual(decisionStatuses, [200])
  assert.deepEqual(historyStatuses, [200, 200])
  assert.deepEqual(enrollmentStatuses, [201])
  assert.deepEqual(cancellationStatuses, [200])
  assert.deepEqual(checkoutStatuses, [201])
  assert.deepEqual(dashboardHttpErrors, [])
  assert.deepEqual(consoleErrors, [])
  assert.deepEqual(failedRequests, [])
  assert.deepEqual(trackerRequests, [])
  process.stdout.write(
    `${JSON.stringify({
      desktop: '1440x1000',
      mobile: '390x844',
      submissionStatus: 201,
      consoleErrors: 0,
      failedRequests: 0,
      abortedPrefetchRequests: abortedRequests,
      trackerRequests: 0,
      horizontalOverflow: false,
      authenticatedInboxStatus: 200,
      decisionStatus: 200,
      historyStatuses,
      enrollmentStatuses,
      cancellationStatuses,
      checkoutStatuses,
      screenshots: [
        'desktop-form.png',
        'desktop-success.png',
        'desktop-paid-form.png',
        'desktop-paid-checkout-redirect.png',
        'desktop-dashboard-baseline.png',
        'desktop-inbox.png',
        'desktop-inbox-decision.png',
        'desktop-inbox-approved.png',
        'desktop-inbox-history.png',
        'desktop-inbox-enrollment-confirmation.png',
        'desktop-inbox-enrolled.png',
        'desktop-enrollment-detail.png',
        'desktop-enrollment-cancellation-confirmation.png',
        'desktop-enrollment-cancelled.png',
        'mobile-form.png',
        'mobile-paid-form.png',
        'mobile-dashboard-baseline.png',
        'mobile-dashboard-priorities.png',
        'mobile-dashboard-programming.png',
        'mobile-dashboard-activity.png',
        'mobile-dashboard-footer.png',
        'mobile-inbox.png',
        'mobile-inbox-list.png',
        'mobile-inbox-history.png',
        'mobile-enrollment-cancelled.png',
      ],
    })}\n`
  )
} finally {
  await browser.close()
}

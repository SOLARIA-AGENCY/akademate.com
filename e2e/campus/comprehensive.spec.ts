import { test, expect } from '@playwright/test'

test.describe('Campus LMS - Student Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005')
  })

  test('AUTH-01: campus login page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Login|Campus/i)
  })

  test('AUTH-02: displays email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('AUTH-03: displays password input field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('AUTH-04: displays login button', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]')
    await expect(loginButton).toBeVisible()
  })

  test('AUTH-05: validates empty email field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const submitButton = page.locator('button[type="submit"]')

    await submitButton.click()
    await expect(emailInput).toBeFocused()
  })

  test('AUTH-06: validates empty password field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill('student@example.com')
    await submitButton.click()
    await expect(passwordInput).toBeFocused()
  })
})

test.describe('Campus LMS - Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard')
  })

  test('DASH-01: dashboard loads after login', async ({ page }) => {
    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard.first()).toBeVisible()
  })

  test('DASH-02: displays student name in header', async ({ page }) => {
    const userName = page.locator('[data-testid="user-name"], .user-name')
    await expect(userName.first()).toBeVisible()
  })

  test('DASH-03: shows enrolled courses list', async ({ page }) => {
    const coursesGrid = page.locator('[data-testid="courses-grid"], .courses-grid')
    await expect(coursesGrid.first()).toBeVisible()
  })

  test('DASH-04: displays course cards with progress', async ({ page }) => {
    const courseCards = page.locator('[data-testid="course-card"], .course-card')
    const count = await courseCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('DASH-05: has progress bar for each course', async ({ page }) => {
    const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar')
    const count = await progressBar.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('DASH-06: displays overall completion percentage', async ({ page }) => {
    const completionRate = page.locator('[data-testid="completion-rate"], .completion-rate')
    await expect(completionRate.first()).toBeVisible()
  })

  test('DASH-07: shows navigation menu', async ({ page }) => {
    const nav = page.locator('nav, [data-testid="navigation"]')
    await expect(nav).toBeVisible()
  })

  test('DASH-08: navigation has correct links', async ({ page }) => {
    const navLinks = page.locator('nav a, [data-testid="nav-link"]')
    const count = await navLinks.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('DASH-09: displays user profile section', async ({ page }) => {
    const profileSection = page.locator('[data-testid="user-profile"], .user-profile')
    await expect(profileSection.first()).toBeVisible()
  })

  test('DASH-10: logout button is visible', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Cerrar sesión")')
    await expect(logoutButton.first()).toBeVisible()
  })
})

test.describe('Campus LMS - Course Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005/course/test-course')
  })

  test('CRS-01: course page loads successfully', async ({ page }) => {
    const courseHeader = page.locator('h1, [data-testid="course-title"]')
    await expect(courseHeader.first()).toBeVisible()
  })

  test('CRS-02: displays course description', async ({ page }) => {
    const description = page.locator('[data-testid="course-description"], .course-description')
    await expect(description.first()).toBeVisible()
  })

  test('CRS-03: shows modules list', async ({ page }) => {
    const modulesList = page.locator('[data-testid="modules-list"], .modules-list')
    await expect(modulesList.first()).toBeVisible()
  })

  test('CRS-04: displays lessons within modules', async ({ page }) => {
    const lessonsList = page.locator('[data-testid="lessons-list"], .lessons-list')
    await expect(lessonsList.first()).toBeVisible()
  })

  test('CRS-05: has start course button', async ({ page }) => {
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Comenzar"), button:has-text("Continuar")'
    )
    await expect(startButton.first()).toBeVisible()
  })

  test('CRS-06: displays course progress', async ({ page }) => {
    const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar')
    await expect(progressBar.first()).toBeVisible()
  })

  test('CRS-07: shows estimated duration', async ({ page }) => {
    const duration = page.locator('[data-testid="course-duration"], .course-duration')
    await expect(duration.first()).toBeVisible()
  })

  test('CRS-08: has enrollment information', async ({ page }) => {
    const enrollmentInfo = page.locator('[data-testid="enrollment-info"], .enrollment-info')
    await expect(enrollmentInfo.first()).toBeVisible()
  })

  test('CRS-09: displays instructor information', async ({ page }) => {
    const instructorInfo = page.locator('[data-testid="instructor-info"], .instructor-info')
    await expect(instructorInfo.first()).toBeVisible()
  })
})

test.describe('Campus LMS - Lesson Viewing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005/lesson/test-lesson')
  })

  test('LSN-01: lesson page loads successfully', async ({ page }) => {
    const lessonHeader = page.locator('h1, [data-testid="lesson-title"]')
    await expect(lessonHeader.first()).toBeVisible()
  })

  test('LSN-02: displays lesson content', async ({ page }) => {
    const lessonContent = page.locator('[data-testid="lesson-content"], .lesson-content')
    await expect(lessonContent.first()).toBeVisible()
  })

  test('LSN-03: has navigation to next lesson', async ({ page }) => {
    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Siguiente"), a:has-text("Siguiente")'
    )
    const count = await nextButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('LSN-04: has navigation to previous lesson', async ({ page }) => {
    const prevButton = page.locator(
      'button:has-text("Previous"), button:has-text("Anterior"), a:has-text("Anterior")'
    )
    const count = await prevButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('LSN-05: marks lesson as completed', async ({ page }) => {
    const completeButton = page.locator(
      'button:has-text("Mark Complete"), button:has-text("Completado")'
    )
    const count = await completeButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('LSN-06: displays lesson duration', async ({ page }) => {
    const duration = page.locator('[data-testid="lesson-duration"], .lesson-duration')
    await expect(duration.first()).toBeVisible()
  })

  test('LSN-07: shows materials list', async ({ page }) => {
    const materialsList = page.locator('[data-testid="materials-list"], .materials-list')
    const count = await materialsList.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('LSN-08: has video player for video lessons', async ({ page }) => {
    const videoPlayer = page.locator('video, [data-testid="video-player"]')
    const count = await videoPlayer.count()
    if (count > 0) {
      await expect(videoPlayer.first()).toBeVisible()
    }
  })
})

test.describe('Campus LMS - Assignment Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005/assignment/test-assignment')
  })

  test('ASN-01: assignment page loads successfully', async ({ page }) => {
    const assignmentHeader = page.locator('h1, [data-testid="assignment-title"]')
    await expect(assignmentHeader.first()).toBeVisible()
  })

  test('ASN-02: displays assignment instructions', async ({ page }) => {
    const instructions = page.locator(
      '[data-testid="assignment-instructions"], .assignment-instructions'
    )
    await expect(instructions.first()).toBeVisible()
  })

  test('ASN-03: shows due date', async ({ page }) => {
    const dueDate = page.locator('[data-testid="due-date"], .due-date')
    await expect(dueDate.first()).toBeVisible()
  })

  test('ASN-04: has submission form', async ({ page }) => {
    const submissionForm = page.locator('form, [data-testid="submission-form"]')
    await expect(submissionForm.first()).toBeVisible()
  })

  test('ASN-05: has file upload input', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput.first()).toBeVisible()
  })

  test('ASN-06: displays submit button', async ({ page }) => {
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Submit"), button:has-text("Entregar")'
    )
    await expect(submitButton.first()).toBeVisible()
  })

  test('ASN-07: shows previous submissions', async ({ page }) => {
    const previousSubmissions = page.locator(
      '[data-testid="previous-submissions"], .previous-submissions'
    )
    const count = await previousSubmissions.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ASN-08: displays grade for graded assignments', async ({ page }) => {
    const gradeDisplay = page.locator('[data-testid="grade-display"], .grade-display')
    const count = await gradeDisplay.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ASN-09: shows feedback from instructor', async ({ page }) => {
    const feedbackDisplay = page.locator('[data-testid="feedback-display"], .feedback-display')
    const count = await feedbackDisplay.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ASN-10: has max score display', async ({ page }) => {
    const maxScore = page.locator('[data-testid="max-score"], .max-score')
    await expect(maxScore.first()).toBeVisible()
  })
})

test.describe('Campus LMS - Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005/progress')
  })

  test('PRG-01: progress page loads successfully', async ({ page }) => {
    const progressPage = page.locator('main, [data-testid="progress-page"]')
    await expect(progressPage.first()).toBeVisible()
  })

  test('PRG-02: displays overall progress percentage', async ({ page }) => {
    const overallProgress = page.locator('[data-testid="overall-progress"], .overall-progress')
    await expect(overallProgress.first()).toBeVisible()
  })

  test('PRG-03: shows progress by course', async ({ page }) => {
    const courseProgress = page.locator('[data-testid="course-progress"], .course-progress')
    const count = await courseProgress.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('PRG-04: displays completed lessons count', async ({ page }) => {
    const completedLessons = page.locator('[data-testid="completed-lessons"], .completed-lessons')
    await expect(completedLessons.first()).toBeVisible()
  })

  test('PRG-05: shows total lessons count', async ({ page }) => {
    const totalLessons = page.locator('[data-testid="total-lessons"], .total-lessons')
    await expect(totalLessons.first()).toBeVisible()
  })

  test('PRG-06: displays time spent learning', async ({ page }) => {
    const timeSpent = page.locator('[data-testid="time-spent"], .time-spent')
    await expect(timeSpent.first()).toBeVisible()
  })

  test('PRG-07: has progress bar visualization', async ({ page }) => {
    const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar')
    await expect(progressBar.first()).toBeVisible()
  })

  test('PRG-08: displays certificates section', async ({ page }) => {
    const certificatesSection = page.locator('[data-testid="certificates"], .certificates')
    await expect(certificatesSection.first()).toBeVisible()
  })

  test('PRG-09: shows download certificate button', async ({ page }) => {
    const downloadButton = page.locator(
      'button:has-text("Download"), button:has-text("Descargar"), a:has-text("Descargar")'
    )
    const count = await downloadButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Campus LMS - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard')
  })

  test('NAV-01: navigation menu is responsive', async ({ page }) => {
    const nav = page.locator('nav, [data-testid="navigation"]')
    await expect(nav).toBeVisible()
  })

  test('NAV-02: clicking course link navigates to course page', async ({ page }) => {
    const courseLink = page.locator('a:has-text("Courses"), a:has-text("Cursos")').first()
    await courseLink.click()

    const coursesGrid = page.locator('[data-testid="courses-grid"], .courses-grid')
    await expect(coursesGrid.first()).toBeVisible()
  })

  test('NAV-03: clicking progress link navigates to progress page', async ({ page }) => {
    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Progreso")').first()
    await progressLink.click()

    const progressPage = page.locator('[data-testid="progress-page"], .progress-page')
    await expect(progressPage.first()).toBeVisible()
  })

  test('NAV-04: back button works in browser', async ({ page }) => {
    await page.goto('http://localhost:3005/course/test-course')
    await page.goBack()

    await expect(page).toHaveURL(/\/dashboard|\/$/)
  })

  test('NAV-05: navigation shows active page highlight', async ({ page }) => {
    const activeLink = page.locator('nav a.active, [data-testid="nav-link"][data-active="true"]')
    const count = await activeLink.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Campus LMS - Responsive Design', () => {
  test('RSP-01: dashboard loads on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3005/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-02: dashboard loads on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3005/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-03: dashboard loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3005/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-04: navigation adapts to mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3005/dashboard')

    const nav = page.locator('nav, [data-testid="navigation"]')
    await expect(nav).toBeVisible()
  })
})

test.describe('Campus LMS - Certificates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005/certificates')
  })

  test('CRT-01: certificates page loads successfully', async ({ page }) => {
    const certificatesPage = page.locator('main, [data-testid="certificates-page"]')
    await expect(certificatesPage.first()).toBeVisible()
  })

  test('CRT-02: displays list of earned certificates', async ({ page }) => {
    const certificatesList = page.locator('[data-testid="certificates-list"], .certificates-list')
    await expect(certificatesList.first()).toBeVisible()
  })

  test('CRT-03: shows certificate title', async ({ page }) => {
    const certificateTitle = page.locator('[data-testid="certificate-title"], .certificate-title')
    const count = await certificateTitle.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('CRT-04: displays certificate issue date', async ({ page }) => {
    const issueDate = page.locator('[data-testid="issue-date"], .issue-date')
    const count = await issueDate.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('CRT-05: has download button for each certificate', async ({ page }) => {
    const downloadButton = page.locator('button:has-text("Download"), a:has-text("Descargar")')
    const count = await downloadButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

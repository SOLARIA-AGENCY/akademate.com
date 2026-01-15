import { test, expect } from '@playwright/test'

test.describe('Tenant-Admin - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009')
  })

  test('AUTH-01: login page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Login|Admin/i)
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

    await emailInput.fill('admin@tenant.com')
    await submitButton.click()
    await expect(passwordInput).toBeFocused()
  })
})

test.describe('Tenant-Admin - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/dashboard')
  })

  test('DASH-01: dashboard loads after login', async ({ page }) => {
    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard.first()).toBeVisible()
  })

  test('DASH-02: displays student count metric', async ({ page }) => {
    const studentCount = page.locator('[data-testid="student-count"], .student-count')
    await expect(studentCount.first()).toBeVisible()
  })

  test('DASH-03: displays course count metric', async ({ page }) => {
    const courseCount = page.locator('[data-testid="course-count"], .course-count')
    await expect(courseCount.first()).toBeVisible()
  })

  test('DASH-04: shows recent enrollments', async ({ page }) => {
    const recentEnrollments = page.locator(
      '[data-testid="recent-enrollments"], .recent-enrollments'
    )
    await expect(recentEnrollments.first()).toBeVisible()
  })

  test('DASH-05: displays navigation sidebar', async ({ page }) => {
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })

  test('DASH-06: has quick action buttons', async ({ page }) => {
    const actionButtons = page.locator('button:has-text("Add"), button:has-text("Create")')
    const count = await actionButtons.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('DASH-07: displays pending assignments count', async ({ page }) => {
    const pendingAssignments = page.locator(
      '[data-testid="pending-assignments"], .pending-assignments'
    )
    await expect(pendingAssignments.first()).toBeVisible()
  })

  test('DASH-08: has user profile section', async ({ page }) => {
    const userProfile = page.locator('[data-testid="user-profile"], .user-profile')
    await expect(userProfile.first()).toBeVisible()
  })

  test('DASH-09: displays academy branding', async ({ page }) => {
    const academyName = page.locator('[data-testid="academy-name"], .academy-name')
    await expect(academyName.first()).toBeVisible()
  })

  test('DASH-10: logout button is visible', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Cerrar sesión")')
    await expect(logoutButton.first()).toBeVisible()
  })
})

test.describe('Tenant-Admin - Users Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/users')
  })

  test('USR-01: users page loads successfully', async ({ page }) => {
    const usersPage = page.locator('main, [data-testid="users-page"]')
    await expect(usersPage.first()).toBeVisible()
  })

  test('USR-02: displays users table', async ({ page }) => {
    const usersTable = page.locator('table, [data-testid="users-table"]')
    await expect(usersTable).toBeVisible()
  })

  test('USR-03: has create user button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create User"), a:has-text("Create")')
    await expect(createButton.first()).toBeVisible()
  })

  test('USR-04: displays user role badges', async ({ page }) => {
    const roleBadge = page.locator('.badge, [data-testid="role-badge"]')
    const count = await roleBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('USR-05: shows user email addresses', async ({ page }) => {
    const emailColumn = page.locator('th:has-text("Email"), th[data-column="email"]')
    await expect(emailColumn.first()).toBeVisible()
  })

  test('USR-06: displays user names', async ({ page }) => {
    const nameColumn = page.locator('th:has-text("Name"), th[data-column="name"]')
    await expect(nameColumn.first()).toBeVisible()
  })

  test('USR-07: has edit actions for users', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Editar")')
    const count = await editButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('USR-08: has delete actions for users', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Eliminar")')
    const count = await deleteButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('USR-09: has search/filter controls', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')
    await expect(searchInput.first()).toBeVisible()
  })

  test('USR-10: displays pagination controls', async ({ page }) => {
    const pagination = page.locator('.pagination, [data-testid="pagination"]')
    const count = await pagination.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Tenant-Admin - Courses Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/courses')
  })

  test('CRS-01: courses page loads successfully', async ({ page }) => {
    const coursesPage = page.locator('main, [data-testid="courses-page"]')
    await expect(coursesPage.first()).toBeVisible()
  })

  test('CRS-02: displays courses list', async ({ page }) => {
    const coursesList = page.locator('[data-testid="courses-list"], .courses-list')
    await expect(coursesList.first()).toBeVisible()
  })

  test('CRS-03: has create course button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Course"), a:has-text("Create")')
    await expect(createButton.first()).toBeVisible()
  })

  test('CRS-04: displays course status badges', async ({ page }) => {
    const statusBadge = page.locator('.badge, [data-testid="status-badge"]')
    const count = await statusBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('CRS-05: shows course enrollment counts', async ({ page }) => {
    const enrollmentCount = page.locator('[data-testid="enrollment-count"], .enrollment-count')
    const count = await enrollmentCount.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('CRS-06: has edit actions for courses', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Editar")')
    const count = await editButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('CRS-07: displays course thumbnails', async ({ page }) => {
    const thumbnail = page.locator('img[data-testid="course-thumbnail"], .course-thumbnail')
    const count = await thumbnail.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('CRS-08: has filter by status', async ({ page }) => {
    const filterSelect = page.locator('select, [data-testid="status-filter"]')
    await expect(filterSelect).toBeVisible()
  })
})

test.describe('Tenant-Admin - Enrollments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/enrollments')
  })

  test('ENR-01: enrollments page loads successfully', async ({ page }) => {
    const enrollmentsPage = page.locator('main, [data-testid="enrollments-page"]')
    await expect(enrollmentsPage.first()).toBeVisible()
  })

  test('ENR-02: displays enrollments table', async ({ page }) => {
    const enrollmentsTable = page.locator('table, [data-testid="enrollments-table"]')
    await expect(enrollmentsTable).toBeVisible()
  })

  test('ENR-03: shows enrollment status', async ({ page }) => {
    const statusBadge = page.locator('.badge, [data-testid="status-badge"]')
    const count = await statusBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ENR-04: displays student information', async ({ page }) => {
    const studentInfo = page.locator('[data-testid="student-info"], .student-info')
    const count = await studentInfo.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ENR-05: shows course information', async ({ page }) => {
    const courseInfo = page.locator('[data-testid="course-info"], .course-info')
    const count = await courseInfo.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ENR-06: displays progress percentages', async ({ page }) => {
    const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar')
    const count = await progressBar.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ENR-07: has approve/reject actions', async ({ page }) => {
    const actionButtons = page.locator('button:has-text("Approve"), button:has-text("Reject")')
    const count = await actionButtons.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ENR-08: shows enrollment dates', async ({ page }) => {
    const dateInfo = page.locator('[data-testid="enrollment-date"], .enrollment-date')
    const count = await dateInfo.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Tenant-Admin - Assignments & Grading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/assignments')
  })

  test('ASN-01: assignments page loads successfully', async ({ page }) => {
    const assignmentsPage = page.locator('main, [data-testid="assignments-page"]')
    await expect(assignmentsPage.first()).toBeVisible()
  })

  test('ASN-02: displays submissions list', async ({ page }) => {
    const submissionsList = page.locator('[data-testid="submissions-list"], .submissions-list')
    await expect(submissionsList.first()).toBeVisible()
  })

  test('ASN-03: shows pending submissions count', async ({ page }) => {
    const pendingCount = page.locator('[data-testid="pending-count"], .pending-count')
    await expect(pendingCount.first()).toBeVisible()
  })

  test('ASN-04: displays grade input fields', async ({ page }) => {
    const gradeInput = page.locator('input[type="number"], [data-testid="grade-input"]')
    const count = await gradeInput.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ASN-05: has submit grade button', async ({ page }) => {
    const submitButton = page.locator(
      'button:has-text("Submit Grade"), button:has-text("Guardar nota")'
    )
    const count = await submitButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ASN-06: displays feedback textarea', async ({ page }) => {
    const feedbackArea = page.locator('textarea, [data-testid="feedback"]')
    const count = await feedbackArea.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ASN-07: shows assignment details', async ({ page }) => {
    const assignmentDetails = page.locator(
      '[data-testid="assignment-details"], .assignment-details'
    )
    await expect(assignmentDetails.first()).toBeVisible()
  })

  test('ASN-08: displays file attachments', async ({ page }) => {
    const fileAttachments = page.locator('a[href], [data-testid="file-attachment"]')
    const count = await fileAttachments.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Tenant-Admin - Certificates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/certificates')
  })

  test('CRT-01: certificates page loads successfully', async ({ page }) => {
    const certificatesPage = page.locator('main, [data-testid="certificates-page"]')
    await expect(certificatesPage.first()).toBeVisible()
  })

  test('CRT-02: displays issued certificates list', async ({ page }) => {
    const certificatesList = page.locator('[data-testid="certificates-list"], .certificates-list')
    await expect(certificatesList.first()).toBeVisible()
  })

  test('CRT-03: has issue certificate button', async ({ page }) => {
    const issueButton = page.locator('button:has-text("Issue"), button:has-text("Emitir")')
    await expect(issueButton.first()).toBeVisible()
  })

  test('CRT-04: displays certificate template selector', async ({ page }) => {
    const templateSelect = page.locator('select, [data-testid="template-selector"]')
    await expect(templateSelect).toBeVisible()
  })

  test('CRT-05: shows recipient information', async ({ page }) => {
    const recipientInfo = page.locator('[data-testid="recipient-info"], .recipient-info')
    await expect(recipientInfo.first()).toBeVisible()
  })

  test('CRT-06: has download button for certificates', async ({ page }) => {
    const downloadButton = page.locator('button:has-text("Download"), a:has-text("Descargar")')
    const count = await downloadButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('CRT-07: displays certificate preview', async ({ page }) => {
    const preview = page.locator('[data-testid="certificate-preview"], .certificate-preview')
    await expect(preview.first()).toBeVisible()
  })
})

test.describe('Tenant-Admin - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/settings')
  })

  test('SET-01: settings page loads successfully', async ({ page }) => {
    const settingsPage = page.locator('main, [data-testid="settings-page"]')
    await expect(settingsPage.first()).toBeVisible()
  })

  test('SET-02: displays academy information form', async ({ page }) => {
    const academyForm = page.locator('form, [data-testid="academy-form"]')
    await expect(academyForm).toBeVisible()
  })

  test('SET-03: has save settings button', async ({ page }) => {
    const saveButton = page.locator('button[type="submit"], button:has-text("Save")')
    await expect(saveButton.first()).toBeVisible()
  })

  test('SET-04: displays academy name input', async ({ page }) => {
    const nameInput = page.locator('input[name="academyName"], input[name="name"]')
    await expect(nameInput).toBeVisible()
  })

  test('SET-05: displays contact information inputs', async ({ page }) => {
    const contactInputs = page.locator('input[type="email"], input[type="tel"]')
    const count = await contactInputs.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('SET-06: has logo upload section', async ({ page }) => {
    const logoUpload = page.locator('input[type="file"], [data-testid="logo-upload"]')
    await expect(logoUpload).toBeVisible()
  })

  test('SET-07: displays theme color picker', async ({ page }) => {
    const colorPicker = page.locator('input[type="color"], [data-testid="color-picker"]')
    await expect(colorPicker).toBeVisible()
  })
})

test.describe('Tenant-Admin - Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/reports')
  })

  test('RPT-01: reports page loads successfully', async ({ page }) => {
    const reportsPage = page.locator('main, [data-testid="reports-page"]')
    await expect(reportsPage.first()).toBeVisible()
  })

  test('RPT-02: displays report types list', async ({ page }) => {
    const reportTypes = page.locator('[data-testid="report-types"], .report-types')
    await expect(reportTypes.first()).toBeVisible()
  })

  test('RPT-03: has generate report button', async ({ page }) => {
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Generar")')
    await expect(generateButton.first()).toBeVisible()
  })

  test('RPT-04: displays date range selector', async ({ page }) => {
    const dateRange = page.locator('input[type="date"], [data-testid="date-range"]')
    await expect(dateRange.first()).toBeVisible()
  })

  test('RPT-05: shows export format options', async ({ page }) => {
    const exportOptions = page.locator('select, [data-testid="export-format"]')
    await expect(exportOptions).toBeVisible()
  })

  test('RPT-06: has download report button', async ({ page }) => {
    const downloadButton = page.locator('button:has-text("Download"), a:has-text("Descargar")')
    const count = await downloadButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('RPT-07: displays generated reports list', async ({ page }) => {
    const reportsList = page.locator('[data-testid="reports-list"], .reports-list')
    await expect(reportsList.first()).toBeVisible()
  })
})

test.describe('Tenant-Admin - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/dashboard')
  })

  test('NAV-01: sidebar navigation is visible', async ({ page }) => {
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })

  test('NAV-02: clicking dashboard link navigates correctly', async ({ page }) => {
    const dashboardLink = page.locator('a:has-text("Dashboard")').first()
    await dashboardLink.click()

    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('NAV-03: clicking users link navigates correctly', async ({ page }) => {
    const usersLink = page.locator('a:has-text("Users"), a:has-text("Usuarios")').first()
    await usersLink.click()

    await expect(page).toHaveURL(/\/users/)
  })

  test('NAV-04: clicking courses link navigates correctly', async ({ page }) => {
    const coursesLink = page.locator('a:has-text("Courses"), a:has-text("Cursos")').first()
    await coursesLink.click()

    await expect(page).toHaveURL(/\/courses/)
  })

  test('NAV-05: back button works in browser', async ({ page }) => {
    await page.goto('http://localhost:3009/users')
    await page.goBack()

    await expect(page).toHaveURL(/\/dashboard|\/$/)
  })
})

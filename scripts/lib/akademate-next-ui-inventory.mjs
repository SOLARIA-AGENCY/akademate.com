import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  'coverage',
  'dist',
  'node_modules',
  'test-results',
])

const DEFAULT_AUDIT_STATE = Object.freeze({
  desktop: 'pending',
  mobile: 'pending',
  accessibility: 'pending',
  states: 'pending',
  evidence: null,
})

const PAGE_FILE_PATTERN = /(?:^|\/)page\.(?:ts|tsx|js|jsx)$/
const LAYOUT_FILE_PATTERN = /(?:^|\/)layout\.(?:ts|tsx|js|jsx)$/

function walkFiles(directory) {
  const files = []

  const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name)
  )

  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue

    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(absolutePath))
    if (entry.isFile()) files.push(absolutePath)
  }

  return files
}

function relativePosix(root, target) {
  return path.relative(root, target).split(path.sep).join('/')
}

export function deriveAppRoute(filePath) {
  const normalized = filePath.split(path.sep).join('/')
  const appMarker = '/app/'
  const markerIndex = normalized.indexOf(appMarker)

  if (markerIndex === -1 || !PAGE_FILE_PATTERN.test(normalized)) {
    throw new Error(`Cannot derive an App Router route from ${filePath}`)
  }

  const routeSegments = normalized
    .slice(markerIndex + appMarker.length)
    .replace(PAGE_FILE_PATTERN, '')
    .split('/')
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .filter((segment) => !segment.startsWith('@'))

  return routeSegments.length === 0 ? '/' : `/${routeSegments.join('/')}`
}

export function analyzeRouteSource(source) {
  const localPrimitiveImports = source.match(
    /from\s+['"][^'"]*(?:components\/ui|@payload-config\/components\/ui)\/[^'"]+['"]/g
  )
  const hardcodedColorTokens = source.match(
    /(?:bg|text|border|ring|outline|fill|stroke|from|via|to)-\[(?:#[\da-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab)\([^\]]+\))\]/g
  )

  return {
    sharedUiImport: source.includes('@akademate/ui'),
    localPrimitiveImportCount: localPrimitiveImports?.length ?? 0,
    hardcodedColorTokenCount: hardcodedColorTokens?.length ?? 0,
  }
}

function isSourceFile(filePath) {
  return /\.(?:ts|tsx|js|jsx)$/.test(filePath)
}

function isTestSource(filePath) {
  return /(?:^|\/)(?:__tests__|__mocks__|tests)(?:\/|$)|\.(?:test|spec)\.[jt]sx?$/.test(filePath)
}

function isLocalPrimitive(filePath) {
  return filePath.includes('/components/ui/') && isSourceFile(filePath) && !isTestSource(filePath)
}

function mergeAuditState(filePath, overrides) {
  return { ...DEFAULT_AUDIT_STATE, ...(overrides[filePath] ?? {}) }
}

function auditStatusCount(pages, field) {
  return pages.filter((page) => page.audit[field].startsWith('verified-')).length
}

export function collectUiInventory(repoRoot, overrides = {}) {
  const appsRoot = path.join(repoRoot, 'apps')
  const apps = {}
  const pages = []
  const discoveredPagePaths = new Set()

  const appEntries = readdirSync(appsRoot, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name)
  )

  for (const appEntry of appEntries) {
    if (!appEntry.isDirectory()) continue

    const appRoot = path.join(appsRoot, appEntry.name)
    const appRouterRoot = path.join(appRoot, 'app')
    if (!existsSync(appRouterRoot)) continue

    const files = walkFiles(appRoot)
    const pageFiles = files.filter((file) => PAGE_FILE_PATTERN.test(file)).sort()
    const layoutFiles = files.filter((file) => LAYOUT_FILE_PATTERN.test(file)).sort()
    const localPrimitiveFiles = files.filter(isLocalPrimitive).sort()
    const sourceFiles = files.filter((file) => isSourceFile(file) && !isTestSource(file))
    const sharedUiConsumers = sourceFiles.filter((file) =>
      readFileSync(file, 'utf8').includes('@akademate/ui')
    )
    const sidebarFiles = sourceFiles.filter((file) => /sidebar/i.test(path.basename(file)))

    for (const pageFile of pageFiles) {
      const relativeFile = relativePosix(repoRoot, pageFile)
      discoveredPagePaths.add(relativeFile)
      pages.push({
        app: appEntry.name,
        file: relativeFile,
        route: deriveAppRoute(relativeFile),
        ...analyzeRouteSource(readFileSync(pageFile, 'utf8')),
        audit: mergeAuditState(relativeFile, overrides),
      })
    }

    apps[appEntry.name] = {
      pages: pageFiles.length,
      layouts: layoutFiles.length,
      localPrimitiveFiles: localPrimitiveFiles.length,
      sharedUiConsumers: sharedUiConsumers.length,
      sidebarFiles: sidebarFiles.length,
    }
  }

  const unknownOverrides = Object.keys(overrides).filter((file) => !discoveredPagePaths.has(file))
  if (unknownOverrides.length > 0) {
    throw new Error(`UI audit overrides reference missing pages: ${unknownOverrides.join(', ')}`)
  }

  pages.sort((left, right) => left.file.localeCompare(right.file))

  return {
    schemaVersion: 1,
    totalPages: pages.length,
    totalLayouts: Object.values(apps).reduce((total, app) => total + app.layouts, 0),
    totalLocalPrimitiveFiles: Object.values(apps).reduce(
      (total, app) => total + app.localPrimitiveFiles,
      0
    ),
    totalSharedUiConsumers: Object.values(apps).reduce(
      (total, app) => total + app.sharedUiConsumers,
      0
    ),
    totalSidebarFiles: Object.values(apps).reduce((total, app) => total + app.sidebarFiles, 0),
    pageSignals: {
      sharedUiPages: pages.filter((page) => page.sharedUiImport).length,
      localPrimitiveImports: pages.reduce(
        (total, page) => total + page.localPrimitiveImportCount,
        0
      ),
      hardcodedColorTokens: pages.reduce((total, page) => total + page.hardcodedColorTokenCount, 0),
    },
    auditProgress: {
      desktopVerified: auditStatusCount(pages, 'desktop'),
      mobileVerified: auditStatusCount(pages, 'mobile'),
      accessibilityVerified: auditStatusCount(pages, 'accessibility'),
      statesVerified: auditStatusCount(pages, 'states'),
    },
    apps,
    pages,
  }
}

export function assertInventorySnapshot(actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      'Akademate Next UI inventory drifted. Review changes and run pnpm audit:ui:write'
    )
  }
}

export function readUiAuditOverrides(filePath) {
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

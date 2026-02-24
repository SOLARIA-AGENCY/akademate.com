import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const catalogPath = path.join(root, 'apps/web/lib/design-system-catalog.ts')
const catalog = fs.readFileSync(catalogPath, 'utf8')
const templateSection = catalog.match(/export const templateNames = \[(.*?)\]/s)

if (!templateSection) {
  throw new Error('templateNames not found in apps/web/lib/design-system-catalog.ts')
}

const templateNames = [...templateSection[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
const variants = ['templates', 'templates-baseui']
const baseVendor = path.join(root, 'vendor/academate-ui')

function listFilesRecursive(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFilesRecursive(fullPath))
    else out.push(fullPath)
  }
  return out
}

const matrix = {}
const allComponents = new Set()

for (const template of templateNames) {
  const components = new Set()
  const foundIn = []

  for (const variant of variants) {
    const templateRoot = path.join(baseVendor, variant, template)
    if (!fs.existsSync(templateRoot)) continue
    foundIn.push(variant)

    const uiDir = path.join(templateRoot, 'components', 'ui')
    if (fs.existsSync(uiDir)) {
      for (const file of fs.readdirSync(uiDir)) {
        if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue
        components.add(file.replace(/\.(tsx|ts)$/, ''))
      }
    }

    const codeFiles = listFilesRecursive(templateRoot).filter((file) => /\.(tsx|ts|jsx|js)$/.test(file))
    for (const file of codeFiles) {
      const content = fs.readFileSync(file, 'utf8')
      for (const match of content.matchAll(/components\/ui\/([a-z0-9-]+)/gi)) {
        components.add(match[1].toLowerCase())
      }
    }
  }

  const list = [...components].sort()
  for (const component of list) allComponents.add(component)

  matrix[template] = {
    variants: foundIn,
    components: list,
    componentCount: list.length,
  }
}

const sortedTemplates = Object.keys(matrix).sort()
const matrixLiteral = JSON.stringify(
  Object.fromEntries(sortedTemplates.map((template) => [template, matrix[template]])),
  null,
  2
)
const allList = JSON.stringify([...allComponents].sort(), null, 2)

const output = `// Auto-generated from vendor/academate-ui templates.
// Regenerate with: node apps/web/scripts/generate-template-component-matrix.mjs

export type TemplateCoverage = {
  variants: string[]
  components: string[]
  componentCount: number
}

export const templateComponentMatrix: Record<string, TemplateCoverage> = ${matrixLiteral}

export const allDetectedTemplateComponents: string[] = ${allList}
`

fs.writeFileSync(path.join(root, 'apps/web/lib/template-component-matrix.ts'), output)
console.log('generated apps/web/lib/template-component-matrix.ts')

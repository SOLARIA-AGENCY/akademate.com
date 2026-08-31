#!/usr/bin/env node
/**
 * Strip <PageHeader> from tenant-admin inner pages.
 * Title lives in SiteHeader breadcrumbs. Keep actions/filters as page controls.
 * Rerun: node apps/tenant-admin/scripts/strip-page-header.mjs
 */
import { createRequire } from 'node:module'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const CHROME_ATTRS = new Set([
  'title',
  'description',
  'icon',
  'iconBgColor',
  'iconColor',
  'badge',
  'withCard',
  'className',
  'data-oid',
])
const KEEP_ATTRS = new Set(['actions', 'filters', 'showAddButton', 'addButtonText', 'onAdd'])

function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue
      walkFiles(path, out)
      continue
    }
    if (!/\.(tsx|ts)$/.test(entry.name)) continue
    out.push(path)
  }
  return out
}

function jsxTagName(node) {
  if (ts.isIdentifier(node.tagName)) return node.tagName.text
  return null
}

function attrName(attr) {
  if (!ts.isJsxAttribute(attr)) return null
  return ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText()
}

function expressionText(sourceFile, initializer) {
  if (!initializer) return null
  if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
    return initializer.getText(sourceFile)
  }
  if (ts.isJsxExpression(initializer)) {
    if (!initializer.expression) return null
    return initializer.expression.getText(sourceFile)
  }
  return initializer.getText(sourceFile)
}

function indentOf(source, start) {
  const lineStart = source.lastIndexOf('\n', start - 1) + 1
  const slice = source.slice(lineStart, start)
  const match = slice.match(/^[ \t]*/)
  return match ? match[0] : ''
}

function collectPageHeaders(sourceFile) {
  const hits = []
  const visit = (node) => {
    if (ts.isJsxSelfClosingElement(node) && jsxTagName(node) === 'PageHeader') {
      hits.push({ kind: 'self', node, attributes: node.attributes })
    } else if (ts.isJsxOpeningElement(node) && jsxTagName(node) === 'PageHeader') {
      const parent = node.parent
      if (parent && ts.isJsxElement(parent)) {
        hits.push({ kind: 'element', node: parent, attributes: node.attributes })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return hits
}

function buildReplacement(sourceFile, attributes, indent) {
  const kept = {}
  for (const attr of attributes.properties) {
    const name = attrName(attr)
    if (!name) continue
    if (KEEP_ATTRS.has(name)) {
      kept[name] = expressionText(sourceFile, attr.initializer)
    }
  }

  const parts = []
  if (kept.actions) parts.push(kept.actions)
  if (kept.showAddButton && kept.onAdd) {
    const label = kept.addButtonText ? `{${kept.addButtonText}}` : '"Nuevo"'
    parts.push(
      `<Button onClick={${kept.onAdd}} size="sm"><Plus className="mr-2 h-4 w-4" />${label}</Button>`,
    )
  }
  if (kept.filters) parts.push(kept.filters)

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]

  const inner = parts
    .map((part) => `${indent}  ${part.split('\n').join(`\n${indent}  `)}`)
    .join('\n')
  return `<div className="flex flex-col gap-3">\n${inner}\n${indent}</div>`
}

function stripPageHeaderImport(source) {
  return source.replace(
    /^[ \t]*import\s*\{[^}]*\bPageHeader\b[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?[ \t]*\n/gm,
    (block) => {
      const next = block
        .replace(/(?:,\s*)?\bPageHeader\b(?:\s*,\s*)?/g, (m) => (m.includes(',') ? '' : ''))
        .replace(/\{\s*,/, '{')
        .replace(/,\s*\}/, '}')
        .replace(/\{\s*\}/, '{}')
      if (/\{\s*\}/.test(next)) return ''
      if (!/\bPageHeader\b/.test(block.replace(/\bPageHeader\b/, ''))) {
        const only = block.match(/import\s*\{\s*PageHeader\s*\}/)
        if (only) return ''
      }
      return next
    },
  )
}

function stripNamedImport(source, localName) {
  const ident = new RegExp(`\\b${localName}\\b`)
  const rest = source.replace(
    new RegExp(`^[ \\t]*import[\\s\\S]*?\\b${localName}\\b[\\s\\S]*?from[\\s\\S]*?$`, 'm'),
    '',
  )
  if (ident.test(rest)) return source
  return source.replace(
    /^[ \t]*import\s*\{([^}]+)\}\s*from\s*(['"][^'"]+['"])\s*;?[ \t]*\n/gm,
    (full, names, from) => {
      if (!names.split(',').some((part) => part.trim().split(/\s+as\s+/).pop().trim() === localName)) {
        return full
      }
      const nextNames = names
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => part.split(/\s+as\s+/).pop().trim() !== localName)
      if (nextNames.length === 0) return ''
      return `import { ${nextNames.join(', ')} } from ${from}\n`
    },
  )
}

function collapseBlankLines(source) {
  return source.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n')
}

function transform(source) {
  if (!source.includes('PageHeader')) return { source, changed: false, count: 0 }
  const sourceFile = ts.createSourceFile('file.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const hits = collectPageHeaders(sourceFile)
  if (hits.length === 0) return { source, changed: false, count: 0 }

  let next = source
  const sorted = [...hits].sort((a, b) => b.node.getStart(sourceFile) - a.node.getStart(sourceFile))
  for (const hit of sorted) {
    const start = hit.node.getStart(sourceFile)
    const end = hit.node.getEnd()
    const indent = indentOf(next, start)
    const replacement = buildReplacement(sourceFile, hit.attributes, indent)
    next = next.slice(0, start) + replacement + next.slice(end)
  }

  next = stripPageHeaderImport(next)

  const candidates = [
    'Plus',
    'BookOpen',
    'MapPin',
    'FileInput',
    'GraduationCap',
    'UserPlus',
    'Sparkles',
    'Megaphone',
    'Settings',
    'Calendar',
    'CalendarDays',
    'Users',
    'Building2',
    'FileText',
    'HelpCircle',
    'BarChart3',
    'Wallet',
    'Receipt',
    'Newspaper',
    'Image',
    'School',
    'Briefcase',
    'CreditCard',
    'ListTodo',
    'MessageSquareQuote',
  ]
  for (const name of candidates) {
    next = stripNamedImport(next, name)
  }

  next = collapseBlankLines(next)
  return { source: next, changed: next !== source, count: hits.length }
}

const roots = [
  join(root, 'app'),
  join(root, '@payload-config/components'),
]

const files = roots.flatMap((dir) => walkFiles(dir))
let changedFiles = 0
let tags = 0

for (const file of files) {
  const original = readFileSync(file, 'utf8')
  if (!original.includes('PageHeader')) continue
  if (file.endsWith(`${join('ui', 'PageHeader.tsx')}`)) continue
  const result = transform(original)
  if (!result.changed) continue
  writeFileSync(file, result.source)
  changedFiles += 1
  tags += result.count
  console.log(`${relative(root, file)}  -${result.count}`)
}

console.log(`updated ${changedFiles} files, stripped ${tags} PageHeader tags`)

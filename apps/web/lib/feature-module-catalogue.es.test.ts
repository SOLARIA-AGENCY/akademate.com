// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  spanishFeatureExplorerCopy,
  spanishFeatureModules,
  type SpanishFeatureModule,
} from './feature-module-catalogue.es'
import {
  featureModuleDetails,
  type FeatureModuleId,
  type ModuleDetail,
} from './feature-module-details'
import { featureGroups } from './marketing-content'

const expectedIds = featureGroups.map((group) => group.id)

describe('Spanish feature module catalogue', () => {
  it('covers exactly the 23 stable module IDs without fallback copy', () => {
    expect(featureGroups).toHaveLength(23)
    expect(spanishFeatureModules).toHaveLength(23)
    expect(spanishFeatureModules.map((module) => module.id)).toEqual(expectedIds)
    expect(new Set(spanishFeatureModules.map((module) => module.id)).size).toBe(23)

    expect(() =>
      assertSpanishCatalogue(featureGroups, featureModuleDetails, spanishFeatureModules)
    ).not.toThrow()
  })

  it('keeps every visible, interactive, alt and ARIA field non-empty and module-specific', () => {
    expect(Object.values(spanishFeatureExplorerCopy).every(isNonEmpty)).toBe(true)

    for (const [index, module] of spanishFeatureModules.entries()) {
      const source = featureGroups[index]
      expect(source?.id).toBe(module.id)
      expect(module.title).not.toBe(source?.title)
      expect(module.eyebrow).not.toBe(source?.eyebrow)
      expect(module.description).not.toBe(source?.description)
      expect(module.features).toHaveLength(source?.features.length ?? 0)
      expect(module.audiences.length).toBeGreaterThan(0)
      expect(module.preview.rows).toHaveLength(featureModuleDetails[index]?.previewRows.length ?? 0)

      for (const value of collectStrings(module)) expect(isNonEmpty(value)).toBe(true)
      for (const row of module.preview.rows) {
        expect(row.action).not.toBe(row.label)
        expect(row.action).not.toBe(row.value)
      }
      expect(module.aria.tab).toContain(module.title)
      expect(module.aria.panel).toContain(module.title)
      expect(module.aria.preview).toContain(module.preview.alt)
    }

    expect(new Set(spanishFeatureModules.map((module) => module.description)).size).toBe(23)
    expect(new Set(spanishFeatureModules.map((module) => module.preview.description)).size).toBe(23)
    expect(new Set(spanishFeatureModules.map((module) => module.preview.note)).size).toBe(23)
    expect(new Set(spanishFeatureModules.map((module) => module.preview.alt)).size).toBe(23)
  })

  it('preserves connectors and claim-bearing signal values byte-for-byte', () => {
    for (const [index, module] of spanishFeatureModules.entries()) {
      expect(module.connectors).toEqual(featureModuleDetails[index]?.connectors)
      expect(module.preview.signal).toBe(featureModuleDetails[index]?.signal)
    }
  })

  it('fails closed when one stable ID has no Spanish sheet', () => {
    const missing = spanishFeatureModules.slice(1)
    expect(() => assertSpanishCatalogue(featureGroups, featureModuleDetails, missing)).toThrow(
      'Spanish catalogue IDs do not match the source catalogue'
    )
  })

  it('fails closed when the source gains a preview row without Spanish copy', () => {
    const details = structuredClone(featureModuleDetails) as ModuleDetail[]
    details[0]?.previewRows.push({ label: 'Unexpected source row', value: 'New state' })
    expect(() => assertSpanishCatalogue(featureGroups, details, spanishFeatureModules)).toThrow(
      'website-catalogue-embeds: preview row count differs'
    )
  })

  it('fails closed when a connector or signal metric is mutated', () => {
    const connectorMutation = structuredClone(
      Array.from(spanishFeatureModules)
    ) as SpanishFeatureModule[]
    connectorMutation[1]!.connectors = ['cloudflare']
    expect(() =>
      assertSpanishCatalogue(featureGroups, featureModuleDetails, connectorMutation)
    ).toThrow('growth-ads-crm: connectors changed')

    const metricMutation = structuredClone(
      Array.from(spanishFeatureModules)
    ) as SpanishFeatureModule[]
    metricMutation[2]!.preview.signal = '99%'
    expect(() =>
      assertSpanishCatalogue(featureGroups, featureModuleDetails, metricMutation)
    ).toThrow('campaign-intelligence: signal changed')
  })

  it('preserves pointer/focus preview and the fixed-height catalogue contract', () => {
    const explorer = readFileSync(
      new URL('../components/marketing/FeatureModuleExplorer.tsx', import.meta.url),
      'utf8'
    )
    expect(explorer).toContain('onMouseEnter={() => selectFeature(item.id)}')
    expect(explorer).toContain('onFocus={() => selectFeature(item.id)}')
    expect(explorer).not.toContain('overflow-y-auto')
    expect(explorer).toContain('lg:grid-cols-2')
    expect(explorer).toContain('role="tablist"')
    expect(explorer).toContain('role="tabpanel"')
  })
})

function assertSpanishCatalogue(
  groups: typeof featureGroups,
  details: readonly ModuleDetail[],
  spanish: readonly SpanishFeatureModule[]
) {
  const sourceIds = groups.map((group) => group.id)
  const spanishIds = spanish.map((module) => module.id)
  if (JSON.stringify(sourceIds) !== JSON.stringify(spanishIds))
    throw new Error('Spanish catalogue IDs do not match the source catalogue')

  for (const id of sourceIds) {
    const group = groups.find((candidate) => candidate.id === id)
    const detail = details.find((candidate) => candidate.id === id)
    const translated = spanish.find((candidate) => candidate.id === id)
    if (!group || !detail || !translated) throw new Error(`${id}: incomplete catalogue record`)
    if (translated.features.length !== group.features.length)
      throw new Error(`${id}: feature count differs`)
    if (translated.audiences.length !== detail.audiences.length)
      throw new Error(`${id}: audience count differs`)
    if (translated.preview.rows.length !== detail.previewRows.length)
      throw new Error(`${id}: preview row count differs`)
    if (JSON.stringify(translated.connectors) !== JSON.stringify(detail.connectors))
      throw new Error(`${id}: connectors changed`)
    if (translated.preview.signal !== detail.signal) throw new Error(`${id}: signal changed`)
  }
}

function collectStrings(module: SpanishFeatureModule): string[] {
  return [
    module.id,
    module.title,
    module.eyebrow,
    module.description,
    ...module.features,
    ...module.audiences,
    module.preview.title,
    module.preview.description,
    module.preview.signal,
    module.preview.signalLabel,
    module.preview.tableHeading,
    ...module.preview.rows.flatMap((row) => [row.label, row.value, row.action]),
    module.preview.note,
    module.preview.alt,
    module.aria.tab,
    module.aria.panel,
    module.aria.preview,
  ]
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

const _typecheckIds: readonly FeatureModuleId[] = expectedIds
void _typecheckIds

import { describe, expect, it } from 'vitest'
import { buildInsightsSummary, type MetaResolvedRange } from '@/app/api/meta/_lib/meta-graph'

const RANGE: MetaResolvedRange = {
  input: '30d',
  datePreset: 'last_30d',
  since: '2026-03-16',
  until: '2026-04-14',
  key: '30d:2026-03-16:2026-04-14',
}

describe('meta-graph result metric resolution', () => {
  it('uses onsite_conversion.lead_grouped when lead is missing', () => {
    const summary = buildInsightsSummary(RANGE, {
      date_start: '2026-03-16',
      date_stop: '2026-04-14',
      spend: '100',
      impressions: '1000',
      clicks: '20',
      actions: [
        { action_type: 'onsite_conversion.lead_grouped', value: '7' },
        { action_type: 'link_click', value: '80' },
      ],
      cost_per_action_type: [{ action_type: 'onsite_conversion.lead_grouped', value: '14.28' }],
    })

    expect(summary.results.result_type).toBe('onsite_conversion.lead_grouped')
    expect(summary.results.value).toBe(7)
    expect(summary.results.cost_per_result).toBe(14.28)
    expect(summary.results.state).toBe('loaded')
  })

  it('does not fallback to non-lead action types', () => {
    const summary = buildInsightsSummary(RANGE, {
      date_start: '2026-03-16',
      date_stop: '2026-04-14',
      spend: '100',
      impressions: '1000',
      clicks: '20',
      actions: [{ action_type: 'link_click', value: '250' }],
      cost_per_action_type: [{ action_type: 'link_click', value: '0.4' }],
    })

    expect(summary.results.result_type).toBeNull()
    expect(summary.results.value).toBeNull()
    expect(summary.results.state).toBe('not_available')
    expect(summary.results.cost_per_result).toBeNull()
  })
})

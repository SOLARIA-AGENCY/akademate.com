import { describe, expect, it } from 'vitest'

import {
  resolveConvocatoriaCampaign,
  type ConvocatoriaCampaignDraft,
} from '../../app/lib/programacion/convocatoria-campaign-resolver'

function draft(overrides: Partial<ConvocatoriaCampaignDraft> = {}): ConvocatoriaCampaignDraft {
  return {
    id: 'draft-1',
    status: 'active',
    metaCampaignId: 'meta-1',
    metaAdSetId: 'adset-1',
    metaAdId: 'ad-1',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('resolveConvocatoriaCampaign', () => {
  it('uses the explicit convocatoria relationship for a cycle without course', () => {
    const result = resolveConvocatoriaCampaign({
      drafts: [draft()],
      candidates: [],
    })

    expect(result).toMatchObject({
      linkStatus: 'linked',
      workflowStatus: 'active',
      deliveryStatus: 'active',
      metaCampaignId: 'meta-1',
      metaAdSetId: 'adset-1',
      primaryMetaAdId: 'ad-1',
    })
  })

  it('never promotes course candidates to a truth relationship', () => {
    const result = resolveConvocatoriaCampaign({
      drafts: [],
      candidates: [{ localCampaignId: 'campaign-2', name: 'Curso 2', reason: 'course_heuristic' }],
    })

    expect(result).toMatchObject({
      linkStatus: 'not_linked',
      metaCampaignId: null,
      candidateCount: 1,
    })
    expect(result.candidates[0]?.reason).toBe('course_heuristic')
  })

  it('fails closed when two current explicit campaigns compete', () => {
    const result = resolveConvocatoriaCampaign({
      drafts: [draft(), draft({ id: 'draft-2', metaCampaignId: 'meta-2' })],
    })

    expect(result).toMatchObject({
      linkStatus: 'ambiguous',
      metaCampaignId: null,
      deliveryStatus: 'unknown',
    })
  })

  it('selects the newest row deterministically when the campaign is repeated', () => {
    const result = resolveConvocatoriaCampaign({
      drafts: [
        draft({ id: 'older', metaAdId: 'ad-old', updatedAt: '2026-07-01T10:00:00.000Z' }),
        draft({ id: 'newer', metaAdId: 'ad-new', updatedAt: '2026-07-02T10:00:00.000Z' }),
      ],
    })

    expect(result.primaryMetaAdId).toBe('ad-new')
  })

  it('does not hide a missing draft table or query failure as no campaign', () => {
    const result = resolveConvocatoriaCampaign({
      drafts: [],
      draftsAvailable: false,
      candidates: [],
    })

    expect(result).toMatchObject({
      linkStatus: 'unavailable',
      source: 'unavailable',
      metaCampaignId: null,
    })
  })

  it('keeps an explicit link authoritative when heuristic candidates are unavailable', () => {
    const result = resolveConvocatoriaCampaign({
      drafts: [draft()],
      candidates: [],
      candidatesAvailable: false,
    })

    expect(result).toMatchObject({
      linkStatus: 'linked',
      metaCampaignId: 'meta-1',
      source: 'workflow',
    })
  })

  it('fails closed when unknown workflow states point to different campaigns', () => {
    const result = resolveConvocatoriaCampaign({
      drafts: [
        draft({ id: 'draft-unknown-1', status: 'unexpected', metaCampaignId: 'meta-1' }),
        draft({ id: 'draft-unknown-2', status: 'unknown', metaCampaignId: 'meta-2' }),
      ],
    })

    expect(result).toMatchObject({
      linkStatus: 'ambiguous',
      metaCampaignId: null,
      deliveryStatus: 'unknown',
    })
  })

  it('maps paused, ended and invalid workflow states fail-closed', () => {
    expect(
      resolveConvocatoriaCampaign({ drafts: [draft({ status: 'meta_paused' })] })
    ).toMatchObject({
      workflowStatus: 'meta_paused',
      deliveryStatus: 'paused',
    })
    expect(resolveConvocatoriaCampaign({ drafts: [draft({ status: 'completed' })] })).toMatchObject(
      {
        workflowStatus: 'ended',
        deliveryStatus: 'completed',
      }
    )
    expect(
      resolveConvocatoriaCampaign({ drafts: [draft({ status: 'unexpected' })] })
    ).toMatchObject({
      workflowStatus: 'error',
      deliveryStatus: 'unknown',
    })
  })
})

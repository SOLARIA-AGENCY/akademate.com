#!/usr/bin/env node

import pg from 'pg'

const { Client } = pg

const tenantId = process.env.META_SMOKE_TENANT_ID || process.env.DEFAULT_TENANT_ID || '1'
const graphVersion = process.env.META_GRAPH_API_VERSION || 'v25.0'
const solariaPrefix = process.env.META_SOLARIA_PREFIX || 'SOLARIA AGENCY'

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, message, ...details }, null, 2))
  process.exit(1)
}

function sanitizeCampaign(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    effective_status: campaign.effective_status,
    updated_time: campaign.updated_time,
  }
}

if (!process.env.DATABASE_URL) {
  fail('DATABASE_URL is required.')
}

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

try {
  const { rows } = await client.query(
    `SELECT integrations_meta_ad_account_id AS ad_account_id,
            integrations_meta_marketing_api_token AS token
       FROM tenants
      WHERE id::text = $1
      LIMIT 1`,
    [tenantId],
  )
  const row = rows[0] || {}
  const adAccountId = String(row.ad_account_id || '').replace(/^act_/i, '')
  const token = String(row.token || '')

  if (!adAccountId || !token) {
    fail('Meta credentials are missing for tenant.', {
      tenant_id: tenantId,
      ad_account_present: Boolean(adAccountId),
      token_present: Boolean(token),
    })
  }

  const url = new URL(`https://graph.facebook.com/${graphVersion}/act_${adAccountId}/campaigns`)
  url.searchParams.set('fields', 'id,name,status,effective_status,updated_time')
  url.searchParams.set('limit', '50')
  url.searchParams.set(
    'filtering',
    JSON.stringify([{ field: 'name', operator: 'CONTAIN', value: solariaPrefix }]),
  )
  url.searchParams.set('access_token', token)

  const started = Date.now()
  const response = await fetch(url)
  const payload = await response.json().catch(() => ({}))
  const campaigns = Array.isArray(payload.data) ? payload.data : []

  if (!response.ok) {
    fail('Meta Graph API request failed.', {
      tenant_id: tenantId,
      graph_version: graphVersion,
      ad_account_id: adAccountId,
      status: response.status,
      error_code: payload.error?.code,
      error_subcode: payload.error?.error_subcode,
      error_type: payload.error?.type,
      fbtrace_id_present: Boolean(payload.error?.fbtrace_id),
      duration_ms: Date.now() - started,
    })
  }

  if (campaigns.length === 0) {
    fail('Meta Graph API returned zero SOLARIA campaigns.', {
      tenant_id: tenantId,
      graph_version: graphVersion,
      ad_account_id: adAccountId,
      solaria_prefix: solariaPrefix,
      duration_ms: Date.now() - started,
    })
  }

  console.log(JSON.stringify({
    ok: true,
    tenant_id: tenantId,
    graph_version: graphVersion,
    ad_account_id: adAccountId,
    solaria_prefix: solariaPrefix,
    solaria_campaigns_count: campaigns.length,
    active_campaigns_count: campaigns.filter((campaign) => campaign.effective_status === 'ACTIVE').length,
    sample_campaigns: campaigns.slice(0, 5).map(sanitizeCampaign),
    duration_ms: Date.now() - started,
  }, null, 2))
} finally {
  await client.end().catch(() => undefined)
}

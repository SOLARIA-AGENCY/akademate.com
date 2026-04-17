export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export type MetricState = 'loaded' | 'zero_real' | 'not_available' | 'api_error'

export interface MetricNumber {
  value: number | null
  state: MetricState
}

export interface InsightsSummary {
  range: {
    input: '7d' | '30d' | '90d' | 'custom'
    since: string
    until: string
  }
  spend: MetricNumber
  impressions: MetricNumber
  reach: MetricNumber
  clicks: MetricNumber
  ctr: MetricNumber
  cpc: MetricNumber
  cpm: MetricNumber
  results: MetricNumber & {
    result_type: string | null
    cost_per_result: number | null
    cost_per_result_state: MetricState
  }
}

export interface CampaignListItem {
  campaign: {
    id: string
    meta_campaign_id: string
    name: string
    status: CampaignStatus
    meta_status: string
    effective_status: string
    objective: string
    campaign_type: 'meta_ads'
    budget: number | null
    created_time: string | null
    updated_time: string | null
    start_time: string | null
    stop_time: string | null
    ads_manager_url: string
  }
  insights_summary: InsightsSummary
  preview: {
    thumbnail_url: string | null
    image_url: string | null
    preview_state: 'loaded' | 'not_available'
  }
  sync_status: {
    last_synced_at: string
    stale: boolean
    source: 'meta_live' | 'cache_stale'
  }
  diagnostics: {
    warnings: string[]
    errors: string[]
  }
}

export interface CampaignsResponse {
  docs: CampaignListItem[]
  totalDocs: number
  page: number
  limit: number
  sort: 'updated_time' | 'created_time' | 'start_time' | 'stop_time' | 'spend' | 'results'
  order: 'asc' | 'desc'
  stale: boolean
  source_health?: {
    status: 'ok' | 'degraded'
    token_status: 'valid' | 'missing' | 'expired' | 'invalid'
    permissions_status: 'ok' | 'missing_ads_read' | 'missing_ads_management' | 'unknown'
    ad_account_id: string
    checked_at: string
    token_expires_at?: string | null
  }
  diagnostics: {
    warnings: string[]
    errors: string[]
  }
  error?: {
    code: string
    message: string
    token_expires_at?: string | null
  }
  generated_at: string
}

export interface CampaignDetailResponse {
  success: boolean
  campaign?: CampaignListItem['campaign']
  insights_summary?: InsightsSummary
  funnel?: {
    series: Array<{
      date: string
      label: string
      form_page_views: number
      form_submissions: number
      crm_leads: number
    }>
    totals: {
      form_page_views: number
      form_submissions: number
      crm_leads: number
    }
    conversion: {
      view_to_submit_pct: number
      view_to_lead_pct: number
    }
    cpl: {
      using: 'crm_leads' | 'form_submissions'
      value: number | null
    }
    source_map: {
      spend: string
      form_page_views: string
      form_submissions: string
      crm_leads: string
    }
  }
  adsets?: Array<{
    id: string
    name: string
    status: string
    effective_status: string
    optimization_goal: string | null
    billing_event: string | null
    budget: number | null
    start_time: string | null
    end_time: string | null
    updated_time: string | null
  }>
  ads?: Array<{
    id: string
    name: string
    status: string
    effective_status: string
    adset_id: string | null
    updated_time: string | null
    creative: {
      id: string | null
      name: string | null
      thumbnail_url: string | null
      image_url: string | null
      video_id: string | null
      preview_state: 'loaded' | 'not_available'
    }
  }>
  creatives?: Array<{
    id: string | null
    name: string | null
    thumbnail_url: string | null
    image_url: string | null
    video_id: string | null
    preview_state: 'loaded' | 'not_available'
  }>
  source_health?: CampaignsResponse['source_health']
  sync_status?: {
    last_synced_at: string
    stale: boolean
    source: 'meta_live' | 'cache_stale'
  }
  diagnostics?: {
    warnings: string[]
    errors: string[]
    request_id?: string
  }
  generated_at?: string
  error?: {
    code: string
    message: string
  }
}

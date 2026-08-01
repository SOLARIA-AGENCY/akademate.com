export type AgenticProvider = {
  id: 'chatgpt' | 'claude' | 'grok' | 'gemini'
  label: string
  provider: string
  asset?: string
  status: 'Planned connector'
}

/**
 * Provider references are intentionally separated from the connector registry.
 * A mark here describes a client option for a future governed MCP connection;
 * it does not imply a partnership, certification or production availability.
 */
export const agenticProviders: readonly AgenticProvider[] = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    provider: 'OpenAI',
    asset: '/brands/openai.svg',
    status: 'Planned connector',
  },
  {
    id: 'claude',
    label: 'Claude',
    provider: 'Anthropic',
    asset: '/brands/claude.svg',
    status: 'Planned connector',
  },
  {
    id: 'grok',
    label: 'Grok',
    provider: 'xAI',
    status: 'Planned connector',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    provider: 'Google',
    asset: '/brands/gemini.svg',
    status: 'Planned connector',
  },
] as const

export const agenticControls = [
  {
    title: 'Read',
    label: 'Summarise enquiries',
    detail: 'Scope: leads:read',
    action: 'No approval needed',
  },
  {
    title: 'Draft',
    label: 'Prepare a follow-up',
    detail: 'Scope: leads:read · draft',
    action: 'Review before send',
  },
  {
    title: 'Confirm',
    label: 'Assign three leads',
    detail: 'Scope: leads:write',
    action: 'Approval required',
  },
] as const

export const campaignMetrics = [
  { label: 'Impressions', value: '24,860' },
  { label: 'Reach', value: 'N/D' },
  { label: 'Clicks', value: '812' },
  { label: 'CTR', value: '3.27%' },
  { label: 'Spend', value: '€1,240' },
  { label: 'Leads', value: '58' },
  { label: 'Applications', value: '21' },
  { label: 'Attributed enrolments', value: '8' },
] as const

export const campaignFunnel = [
  { label: 'Campaign', value: '24,860' },
  { label: 'Landing', value: '812' },
  { label: 'Lead', value: '58' },
  { label: 'Application', value: '21' },
  { label: 'Enrolment', value: '8' },
] as const

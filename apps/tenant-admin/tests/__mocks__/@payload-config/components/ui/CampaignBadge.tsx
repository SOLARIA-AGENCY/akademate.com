import type { JSX } from 'react'

interface CampaignBadgeProps {
  status: string
  campaignId?: string | number
  className?: string
}

export function CampaignBadge({ status, campaignId, className = '' }: CampaignBadgeProps): JSX.Element {
  return (
    <span data-testid="campaign-badge" className={className}>
      {status}
      {campaignId ? `#${campaignId}` : ''}
    </span>
  )
}

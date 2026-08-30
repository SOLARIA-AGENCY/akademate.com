import { settingsPlanLabels, type TenantPlanSnapshot } from '@/lib/tenantPlanChrome'

export function TenantPlanBadges({ plan, deploymentMode }: TenantPlanSnapshot) {
  const labels = settingsPlanLabels({ plan, deploymentMode })
  if (labels.length === 0) return null

  return (
    <div data-testid="tenant-plan-badges" className="flex flex-wrap items-center gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded border border-slate-300 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-700"
        >
          {label}
        </span>
      ))}
    </div>
  )
}

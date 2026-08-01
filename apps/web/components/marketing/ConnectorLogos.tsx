import Image from 'next/image'
import { integrationBrands, type IntegrationBrandId } from '@/lib/integration-brands'

export function ConnectorLogos({
  ids,
  compact = false,
}: {
  ids: readonly IntegrationBrandId[]
  compact?: boolean
}) {
  if (ids.length === 0)
    return (
      <p className="text-sm leading-6 text-slate-500">
        Built into the Akademate operating model without an external provider dependency.
      </p>
    )

  return (
    <div className="flex flex-wrap gap-2" aria-label="Connected services and supported methods">
      {ids.map((id) => {
        const brand = integrationBrands[id]
        return (
          <div
            key={id}
            className={`group flex items-center gap-2 rounded-xl border border-slate-200 bg-white ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
            title={`${brand.label}: ${brand.status}`}
          >
            {'preserveColor' in brand && brand.preserveColor ? (
              <span className="relative h-5 w-8 overflow-hidden">
                <Image
                  src={brand.asset}
                  alt={brand.label}
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="h-5 w-5 shrink-0"
                style={{
                  backgroundColor: brand.color,
                  WebkitMask: `url(${brand.asset}) center / contain no-repeat`,
                  mask: `url(${brand.asset}) center / contain no-repeat`,
                }}
              />
            )}
            <span className="text-xs font-semibold text-slate-800">{brand.label}</span>
            {!compact && (
              <span className="hidden text-[11px] text-slate-400 xl:inline">{brand.status}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

'use client'

import Image from 'next/image'
import { usePreviewCopy } from '@/components/i18n/use-preview-copy'
import { integrationBrands, type IntegrationBrandId } from '@/lib/integration-brands'

export function ConnectorLogos({
  ids,
  compact = false,
}: {
  ids: readonly IntegrationBrandId[]
  compact?: boolean
}) {
  const copy = usePreviewCopy()
  if (ids.length === 0)
    return <p className="text-sm leading-6 text-slate-500">{copy.connectors.empty}</p>

  return (
    <div
      className={`grid w-full gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}
      aria-label={copy.connectors.ariaLabel}
    >
      {ids.map((id) => {
        const brand = integrationBrands[id]
        return (
          <div
            key={id}
            className={`group flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white ${compact ? 'px-3 py-2' : 'min-h-12 px-4 py-3'}`}
            title={`${brand.label}: ${copy.connectors.status[brand.status]}`}
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
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-800">
                {brand.label}
              </span>
              <span className="block truncate text-[10px] leading-4 text-slate-400">
                {copy.connectors.status[brand.status]}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

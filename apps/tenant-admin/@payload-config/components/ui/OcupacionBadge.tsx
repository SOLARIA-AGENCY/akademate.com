'use client'

interface OcupacionBadgeProps {
  plazasOcupadas: number
  plazasTotal: number
  showBar?: boolean
  className?: string
}

export function OcupacionBadge({
  plazasOcupadas,
  plazasTotal,
  showBar = false,
  className = '',
}: OcupacionBadgeProps) {
  const porcentaje = plazasTotal > 0 ? Math.round((plazasOcupadas / plazasTotal) * 100) : 0
  const estaCompleto = porcentaje >= 100

  const colorConfig = (() => {
    if (estaCompleto) {
      return {
        badge: 'text-white bg-red-600 border-red-600',
        bar: 'bg-red-600',
        label: 'Completo',
      }
    }
    if (porcentaje > 85) {
      return {
        badge: 'text-white bg-red-500 border-red-500',
        bar: 'bg-red-500',
        label: `${plazasOcupadas}/${plazasTotal}`,
      }
    }
    if (porcentaje >= 50) {
      return {
        badge: 'text-white bg-amber-500 border-amber-500',
        bar: 'bg-amber-500',
        label: `${plazasOcupadas}/${plazasTotal}`,
      }
    }
    return {
      badge: 'text-white bg-emerald-600 border-emerald-600',
      bar: 'bg-emerald-500',
      label: `${plazasOcupadas}/${plazasTotal}`,
    }
  })()

  return (
    <div className={`flex flex-col gap-1 ${className}`} data-oid="1xy51b5">
      <div className="flex items-center gap-2" data-oid="_hb7-rg">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorConfig.badge}`}
          data-oid="tzrovy6"
        >
          {estaCompleto ? colorConfig.label : `${colorConfig.label} plazas`}
        </span>
        {!estaCompleto && (
          <span className="text-xs text-muted-foreground" data-oid="ebfgs:g">
            {porcentaje}%
          </span>
        )}
      </div>
      {showBar && (
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden" data-oid="hr_n.68">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorConfig.bar}`}
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Ocupación: ${porcentaje}%`}
            data-oid="7xcb2ti"
          />
        </div>
      )}
    </div>
  )
}

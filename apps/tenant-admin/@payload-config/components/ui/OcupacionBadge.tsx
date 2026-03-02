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
        badge: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-800',
        bar: 'bg-red-500',
        label: `${plazasOcupadas}/${plazasTotal}`,
      }
    }
    if (porcentaje >= 50) {
      return {
        badge: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800',
        bar: 'bg-amber-500',
        label: `${plazasOcupadas}/${plazasTotal}`,
      }
    }
    return {
      badge: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950 dark:border-emerald-800',
      bar: 'bg-emerald-500',
      label: `${plazasOcupadas}/${plazasTotal}`,
    }
  })()

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorConfig.badge}`}
        >
          {estaCompleto ? colorConfig.label : `${colorConfig.label} plazas`}
        </span>
        {!estaCompleto && (
          <span className="text-xs text-muted-foreground">{porcentaje}%</span>
        )}
      </div>
      {showBar && (
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorConfig.bar}`}
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Ocupación: ${porcentaje}%`}
          />
        </div>
      )}
    </div>
  )
}

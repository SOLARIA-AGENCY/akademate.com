'use client'

import { AlertCircle, Database } from 'lucide-react'

interface MockDataIndicatorProps {
  /** Label to display (e.g., "Datos simulados", "Pendiente conexión API") */
  label?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show as badge inline or as overlay */
  variant?: 'badge' | 'overlay' | 'banner'
  /** Additional CSS classes */
  className?: string
}

/**
 * Visual indicator for mock/placeholder data
 * Use this to clearly mark sections that are not yet connected to real APIs
 *
 * @example
 * // Badge on a card
 * <MockDataIndicator size="sm" />
 *
 * // Overlay on a chart
 * <MockDataIndicator variant="overlay" label="Gráfico de demostración" />
 *
 * // Banner at top of section
 * <MockDataIndicator variant="banner" label="Esta sección usa datos de prueba" />
 */
export function MockDataIndicator({
  label = 'Datos mock',
  size = 'sm',
  variant = 'badge',
  className = '',
}: MockDataIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  if (variant === 'overlay') {
    return (
      <div
        className={`absolute inset-0 bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg ${className}`}
        data-oid="ijopf_p"
      >
        <div
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center gap-2 text-gray-300"
          data-oid="ogjpoa9"
        >
          <Database size={20} className="text-gray-400" data-oid="f6_h3z7" />
          <span className="font-medium" data-oid="9ug8vii">
            {label}
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={`w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 flex items-center gap-2 ${className}`}
        data-oid="3q4xi.q"
      >
        <AlertCircle size={16} className="text-gray-400 shrink-0" data-oid="0jb7kh6" />
        <span className="text-sm text-gray-500 dark:text-gray-400" data-oid="7oo4s_i">
          {label}
        </span>
      </div>
    )
  }

  // Default: badge
  return (
    <span
      className={`
      inline-flex items-center rounded-full font-medium
      bg-gray-100 dark:bg-gray-800
      text-gray-500 dark:text-gray-400
      border border-gray-200 dark:border-gray-700
      ${sizeClasses[size]}
      ${className}
    `}
      data-oid="reyv7-i"
    >
      <Database size={iconSizes[size]} className="opacity-60" data-oid="koznib-" />
      <span data-oid="bjoc53g">{label}</span>
    </span>
  )
}

/**
 * HOC wrapper to add mock data indicator to any component
 */
export function withMockIndicator<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  indicatorProps?: MockDataIndicatorProps
) {
  return function MockWrappedComponent(props: P) {
    return (
      <div className="relative" data-oid="jb945zm">
        <WrappedComponent {...props} data-oid="4zg4gmo" />
        <div className="absolute top-2 right-2 z-10" data-oid="m06r5bi">
          <MockDataIndicator {...indicatorProps} data-oid="4_x0htc" />
        </div>
      </div>
    )
  }
}

/**
 * Card wrapper with mock data styling (grayed out)
 */
export function MockDataCard({
  children,
  title,
  label = 'Datos mock',
  className = '',
}: {
  children: React.ReactNode
  title?: string
  label?: string
  className?: string
}) {
  return (
    <div
      className={`
      relative rounded-xl border border-dashed border-gray-300 dark:border-gray-700
      bg-gray-50/50 dark:bg-gray-900/30
      ${className}
    `}
      data-oid="gv:2291"
    >
      {/* Mock indicator badge */}
      <div className="absolute -top-3 right-4 z-10" data-oid="ypjsglr">
        <MockDataIndicator label={label} size="sm" data-oid="vsp3vpr" />
      </div>

      {/* Content with reduced opacity */}
      <div className="opacity-60 grayscale-[30%] p-4" data-oid="ep23nrv">
        {title && (
          <h3
            className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3"
            data-oid="inygubo"
          >
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  )
}

export default MockDataIndicator

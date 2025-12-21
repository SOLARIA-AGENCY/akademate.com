'use client'

/**
 * Progress Bar Component
 * Visual indicator for course/lesson completion
 */

interface ProgressBarProps {
    value: number // 0-100
    className?: string
    showLabel?: boolean
}

export function ProgressBar({ value, className = '', showLabel = true }: ProgressBarProps) {
    const clampedValue = Math.min(100, Math.max(0, value))

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progreso</span>
                    <span>{clampedValue}%</span>
                </div>
            )}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
        </div>
    )
}

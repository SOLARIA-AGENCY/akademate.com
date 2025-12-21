'use client';

/**
 * StreakIndicator Component
 *
 * Displays current learning streak with fire animation.
 */

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
  compact?: boolean;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  className = '',
  compact = false,
}: StreakIndicatorProps) {
  const isActive = currentStreak > 0;
  const isRecord = currentStreak > 0 && currentStreak >= longestStreak;

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full
          ${isActive ? 'bg-orange-500/20 text-orange-500' : 'bg-muted text-muted-foreground'}
          ${className}
        `}
      >
        <span className={isActive ? 'animate-pulse' : ''}>🔥</span>
        <span className="text-sm font-medium">{currentStreak}</span>
      </div>
    );
  }

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-xl border
        ${isActive
          ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30'
          : 'bg-muted/50 border-muted'
        }
        ${className}
      `}
    >
      <div
        className={`
          text-3xl
          ${isActive ? 'animate-bounce' : 'opacity-50'}
        `}
      >
        🔥
      </div>

      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${isActive ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {currentStreak}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentStreak === 1 ? 'día' : 'días'}
          </span>
          {isRecord && currentStreak > 1 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">
              ¡Récord!
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-0.5">
          Mejor racha: {longestStreak} {longestStreak === 1 ? 'día' : 'días'}
        </div>
      </div>

      {/* Streak dots visualization */}
      <div className="flex gap-0.5">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className={`
              w-2 h-6 rounded-full
              ${i < currentStreak
                ? 'bg-gradient-to-t from-orange-500 to-yellow-400'
                : 'bg-muted'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}

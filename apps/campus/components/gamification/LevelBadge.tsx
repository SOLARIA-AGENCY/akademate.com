'use client';

/**
 * LevelBadge Component
 *
 * Displays user level with progress to next level.
 */

interface LevelBadgeProps {
  level: number;
  progress: number; // 0-100 to next level
  points: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
};

const getLevelColor = (level: number): string => {
  if (level >= 50) return 'from-yellow-400 to-amber-600'; // Gold
  if (level >= 30) return 'from-purple-400 to-purple-600'; // Purple
  if (level >= 20) return 'from-blue-400 to-blue-600'; // Blue
  if (level >= 10) return 'from-green-400 to-green-600'; // Green
  return 'from-gray-400 to-gray-600'; // Gray
};

export function LevelBadge({
  level,
  progress,
  points,
  className = '',
  size = 'md',
}: LevelBadgeProps) {
  const levelColor = getLevelColor(level);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Level circle */}
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]}
            rounded-full bg-gradient-to-br ${levelColor}
            flex items-center justify-center
            font-bold text-white shadow-lg
            ring-2 ring-white/20
          `}
        >
          {level}
        </div>
        {/* Progress ring */}
        <svg
          className="absolute inset-0 w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="white"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.89} 289`}
            className="transition-all duration-500"
          />
        </svg>
      </div>

      {/* Points display */}
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Nivel {level}</span>
        <span className="font-semibold text-foreground">
          {points.toLocaleString()} pts
        </span>
        <span className="text-xs text-muted-foreground">
          {progress}% al siguiente
        </span>
      </div>
    </div>
  );
}

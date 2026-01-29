'use client';

/**
 * PointsAnimation Component
 *
 * Displays animated points earned notifications.
 * Shows "+X points" with a fade-in/slide-up animation.
 */

import { useEffect, useState } from 'react';

/** Represents a points animation notification */
interface PointsAnimationData {
  id: string;
  points: number;
  reason: string;
  timestamp: Date;
}

interface PointsAnimationProps {
  animations: PointsAnimationData[];
  onDismiss: (id: string) => void;
}

export function PointsAnimation({ animations, onDismiss }: PointsAnimationProps) {
  if (animations.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {animations.map((animation) => (
        <AnimationItem
          key={animation.id}
          animation={animation}
          onDismiss={() => onDismiss(animation.id)}
        />
      ))}
    </div>
  );
}

interface AnimationItemProps {
  animation: PointsAnimationData;
  onDismiss: () => void;
}

function AnimationItem({ animation, onDismiss }: AnimationItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Start exit animation after 2.5s
    const exitTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 2500);

    // Remove after exit animation
    const removeTimer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  const isPointsAnimation = animation.points > 0;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
        bg-gradient-to-r ${isPointsAnimation ? 'from-yellow-500 to-amber-500' : 'from-purple-500 to-pink-500'}
        text-white px-4 py-2 rounded-lg shadow-lg
        flex items-center gap-2 min-w-[160px]
      `}
    >
      {isPointsAnimation ? (
        <>
          <span className="text-2xl">⭐</span>
          <div>
            <div className="font-bold text-lg">+{animation.points}</div>
            <div className="text-xs opacity-90">{animation.reason}</div>
          </div>
        </>
      ) : (
        <>
          <span className="text-2xl">{animation.reason.split(' ')[0]}</span>
          <div className="font-medium">
            {animation.reason.split(' ').slice(1).join(' ')}
          </div>
        </>
      )}
    </div>
  );
}

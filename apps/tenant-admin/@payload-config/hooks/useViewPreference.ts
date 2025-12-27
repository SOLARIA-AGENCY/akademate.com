/**
 * View Preference Hook
 *
 * Persists user's view preference (grid/list) per page in localStorage.
 */

import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'grid' | 'list';
export type ViewType = ViewMode; // Alias for backward compatibility

export function useViewPreference(
  pageKey: string,
  defaultView: ViewMode = 'grid'
): [ViewMode, (view: ViewMode) => void] {
  const storageKey = `viewPreference_${pageKey}`;

  const [view, setViewState] = useState<ViewMode>(defaultView);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(storageKey);
    if (stored === 'grid' || stored === 'list') {
      setViewState(stored);
    }
  }, [storageKey]);

  // Save to localStorage on change
  const setView = useCallback(
    (newView: ViewMode) => {
      setViewState(newView);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newView);
      }
    },
    [storageKey]
  );

  return [view, setView];
}

'use client';

import { AlertTriangle } from 'lucide-react';

interface MockDataBannerProps {
  message?: string;
}

export function MockDataBanner({ message = 'Mock Data' }: MockDataBannerProps) {
  return (
    <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-500" />
      <span className="text-amber-500 text-sm font-medium">{message}</span>
    </div>
  );
}

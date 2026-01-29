'use client';

/**
 * RealtimeProvider for admin-client
 *
 * Provides Socket.io connection for real-time system monitoring.
 * Auto-connects when auth token is available.
 */

import type { ReactNode} from 'react';
import { useEffect, useState } from 'react';
import { SocketProvider } from '@akademate/realtime/context';
import Cookies from 'js-cookie';

/** Type-safe cookie getter (js-cookie types not available) */
const getCookie = (name: string): string | undefined => {
  return (Cookies as { get: (name: string) => string | undefined }).get(name);
};

/** User data structure from cookies/localStorage */
interface UserData {
  id?: number | string;
  role?: string;
}

interface AuthData {
  token: string;
  userId: string;
  role: string;
  tenantId: number;
}

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Get auth data from cookies or localStorage
  useEffect(() => {
    const getAuthData = (): void => {
      try {
        // Try to get from cookie first (admin-client uses js-cookie)
        const token = getCookie('akademate_admin_token');
        const userJson = getCookie('akademate_admin_user');

        if (token && userJson) {
          const userData = JSON.parse(userJson) as UserData;
          setAuthData({
            token,
            userId: String(userData.id ?? '0'),
            role: userData.role ?? 'superadmin',
            tenantId: 0, // Admin client uses tenant 0 (global)
          });
          setIsReady(true);
          return;
        }

        // Fallback: try localStorage
        const storedToken: string | null = localStorage.getItem('akademate_admin_token');
        const storedUser: string | null = localStorage.getItem('akademate_admin_user');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser) as UserData;
          setAuthData({
            token: storedToken,
            userId: String(userData.id ?? '0'),
            role: userData.role ?? 'superadmin',
            tenantId: 0,
          });
        }
      } catch (error) {
        console.warn('[RealtimeProvider] Could not get auth data:', error);
      } finally {
        setIsReady(true);
      }
    };

    getAuthData();
  }, []);

  // Don't render SocketProvider until we've checked for auth
  if (!isReady) {
    return <>{children}</>;
  }

  // If no auth data, render children without socket (graceful degradation)
  if (!authData) {
    return <>{children}</>;
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3009';

  return (
    <SocketProvider
      url={socketUrl}
      tenantId={authData.tenantId}
      userId={authData.userId}
      role={authData.role}
      token={authData.token}
      autoConnect={true}
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </SocketProvider>
  );
}

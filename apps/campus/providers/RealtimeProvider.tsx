'use client';

/**
 * RealtimeProvider for Campus LMS
 *
 * Provides Socket.io connection for real-time progress tracking,
 * gamification updates, and notifications.
 * Auto-connects when student auth is available.
 */

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { SocketProvider } from '@akademate/realtime/context';

/** Session API response structure */
interface SessionResponse {
  user?: {
    id?: number | string;
    role?: string;
    tenantId?: number;
  };
  accessToken?: string;
}

/** LocalStorage user data structure */
interface StoredUserData {
  id?: number | string;
  userId?: number | string;
  role?: string;
  tenantId?: number;
}

/** Internal auth data for socket connection */
interface AuthData {
  token: string;
  userId: string;
  role: string;
  tenantId: number;
}

interface RealtimeProviderProps {
  children: ReactNode;
  tenantId?: number;
}

export function RealtimeProvider({ children, tenantId: defaultTenantId = 1 }: RealtimeProviderProps) {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Get auth data from session or localStorage
  useEffect(() => {
    const getAuthData = async () => {
      try {
        // Try to get from session API first (server-side auth)
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const session = (await sessionResponse.json()) as SessionResponse;
          if (session.user?.id && session.accessToken) {
            setAuthData({
              token: session.accessToken,
              userId: String(session.user.id),
              role: session.user.role ?? 'student',
              tenantId: session.user.tenantId ?? defaultTenantId,
            });
            setIsReady(true);
            return;
          }
        }

        // Fallback: try localStorage (client-side auth)
        const storedToken = localStorage.getItem('akademate_campus_token');
        const storedUser = localStorage.getItem('akademate_campus_user');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser) as StoredUserData;
          const userId = userData.id ?? userData.userId;
          setAuthData({
            token: storedToken,
            userId: userId != null ? String(userId) : '0',
            role: userData.role ?? 'student',
            tenantId: userData.tenantId ?? defaultTenantId,
          });
        }
      } catch (error) {
        console.warn('[CampusRealtimeProvider] Could not get auth data:', error);
      } finally {
        setIsReady(true);
      }
    };

    void getAuthData();
  }, [defaultTenantId]);

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

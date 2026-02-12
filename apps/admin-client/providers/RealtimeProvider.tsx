'use client';

/**
 * RealtimeProvider for admin-client
 *
 * Provides Socket.io connection for real-time system monitoring.
 * Auto-connects when auth token is available.
 *
 * Auth data is fetched from the server-side /api/auth/session endpoint
 * which reads the httpOnly cookie. Tokens are never stored in JS-accessible
 * cookies or localStorage.
 */

import { ReactNode, useEffect, useState } from 'react';
import { SocketProvider } from '@akademate/realtime/context';

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

  // Get auth data from server-side session endpoint (reads httpOnly cookie)
  useEffect(() => {
    const getAuthData = async () => {
      try {
        // Fetch auth data from server — the httpOnly cookie is sent automatically
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.socketToken) {
            setAuthData({
              token: data.socketToken,
              userId: data.user?.id?.toString() || '0',
              role: data.user?.role || 'superadmin',
              tenantId: 0, // Admin client uses tenant 0 (global)
            });
          }
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

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3009';

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

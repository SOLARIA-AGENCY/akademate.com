'use client';

/**
 * Campus Session Context
 *
 * Provides authentication state and user session management
 * for the Campus Virtual application.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  tenantId: number;
  roles: string[];
}

export interface SessionState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface SessionContextValue extends SessionState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const SessionContext = createContext<SessionContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function useUser(): User | null {
  const { user } = useSession();
  return user;
}

export function useRequireAuth(): User {
  const { user, isLoading, isAuthenticated } = useSession();

  if (!isLoading && !isAuthenticated) {
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
}

// ============================================================================
// Provider
// ============================================================================

interface SessionProviderProps {
  children: React.ReactNode;
  apiBaseUrl?: string;
}

export function SessionProvider({
  children,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3009',
}: SessionProviderProps) {
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Fetch current user session
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/users/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user || data.data?.user || data,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else if (response.status === 401) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      } else {
        throw new Error('Failed to fetch session');
      }
    } catch (error) {
      console.error('[SessionProvider] Error fetching session:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [apiBaseUrl]);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user || data.data?.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorData.error || 'Login failed',
        }));
        return false;
      }
    } catch (error) {
      console.error('[SessionProvider] Login error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      return false;
    }
  }, [apiBaseUrl]);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${apiBaseUrl}/api/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[SessionProvider] Logout error:', error);
    } finally {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }, [apiBaseUrl]);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    await fetchSession();
  }, [fetchSession]);

  // Initial session fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const value: SessionContextValue = {
    ...state,
    login,
    logout,
    refreshSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// ============================================================================
// Auth Guard Component
// ============================================================================

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  fallback = <div className="flex items-center justify-center min-h-screen">Cargando...</div>,
  redirectTo = '/auth/login',
}: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useSession();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== 'undefined') {
      const redirect = encodeURIComponent(window.location.pathname);
      window.location.href = `${redirectTo}?redirect=${redirect}`;
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

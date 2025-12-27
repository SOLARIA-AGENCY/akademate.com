'use client';

/**
 * Campus Virtual Session Provider
 *
 * Provides authentication context for the Campus Virtual (student-facing LMS).
 * Uses JWT tokens stored in cookies or localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  tenantId: number;
}

export interface Enrollment {
  id: string;
  courseRunId: string;
  courseTitle: string;
  status: 'active' | 'completed' | 'expired' | 'suspended';
  progressPercent: number;
  startedAt?: string;
  completedAt?: string;
}

export interface SessionContextValue {
  student: Student | null;
  enrollments: Enrollment[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for token in localStorage (campus uses separate auth)
      const token = localStorage.getItem('campus_token');

      if (!token) {
        setStudent(null);
        setEnrollments([]);
        return;
      }

      // Validate token and get student data
      const response = await fetch('/api/campus/session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token expired or invalid
        localStorage.removeItem('campus_token');
        setStudent(null);
        setEnrollments([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setStudent(data.student);
        setEnrollments(data.enrollments || []);
      }
    } catch (err) {
      console.error('[SessionProvider] Session check failed:', err);
      setError('Failed to validate session');
      setStudent(null);
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/campus/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Login failed');
        return false;
      }

      // Store token
      localStorage.setItem('campus_token', data.token);

      // Set student and enrollments
      setStudent(data.student);
      setEnrollments(data.enrollments || []);

      return true;
    } catch (err) {
      console.error('[SessionProvider] Login failed:', err);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Call logout API
      await fetch('/api/campus/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
        },
      });
    } catch (err) {
      console.error('[SessionProvider] Logout error:', err);
    } finally {
      // Always clear local state
      localStorage.removeItem('campus_token');
      setStudent(null);
      setEnrollments([]);
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await checkSession();
  }, []);

  const value: SessionContextValue = {
    student,
    enrollments,
    isLoading,
    isAuthenticated: !!student,
    error,
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
// Hook
// ============================================================================

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}

// ============================================================================
// Auth Guard Component
// ============================================================================

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Acceso Requerido</h2>
        <p className="text-muted-foreground mb-4">
          Debes iniciar sesion para acceder al Campus Virtual.
        </p>
        <a href="/campus/login" className="text-primary hover:underline">
          Iniciar Sesion
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

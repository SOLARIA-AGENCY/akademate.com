/**
 * Payload Config Hooks (Re-export from src/hooks)
 *
 * This module re-exports hooks from the main hooks directory
 * to maintain compatibility with @payload-config imports.
 */

export * from '../src/hooks/auditLog';
export * from './hooks/index';

// Re-export common hook utilities
export const usePayloadConfig = () => {
  // Stub for config access
  return null;
};

import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Auth error detection utilities
 *
 * This module provides utilities for detecting authentication/authorization errors
 * from Supabase operations, particularly 401/403 errors that indicate session expiry.
 */

/**
 * Check if an error is an authentication/authorization error (401/403)
 *
 * Supabase returns errors with code/message properties. Common auth error codes:
 * - 'PGRST301' - JWT expired
 * - '401' - Unauthorized
 * - '403' - Forbidden
 * - Other patterns in error message indicating auth issues
 *
 * @param error - The error from a Supabase operation
 * @returns true if the error is auth-related (401/403)
 */
export function isAuthError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  // Check PostgrestError (from database operations)
  const pgError = error as PostgrestError;
  if (pgError.code) {
    // PGRST301 is specifically JWT expired
    if (pgError.code === 'PGRST301') {
      return true;
    }

    // Check for HTTP status codes in error code
    if (pgError.code === '401' || pgError.code === '403') {
      return true;
    }
  }

  // Check error message for auth-related keywords
  const message = (error as Error).message?.toLowerCase() || '';
  if (
    message.includes('jwt') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('not authorized') ||
    message.includes('session') ||
    message.includes('token')
  ) {
    return true;
  }

  return false;
}

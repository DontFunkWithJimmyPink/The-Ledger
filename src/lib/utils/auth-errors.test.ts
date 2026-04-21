import { isAuthError } from './auth-errors';
import type { PostgrestError } from '@supabase/supabase-js';

describe('isAuthError', () => {
  it('should return false for null error', () => {
    expect(isAuthError(null)).toBe(false);
  });

  it('should return false for undefined error', () => {
    expect(isAuthError(undefined)).toBe(false);
  });

  it('should return true for PGRST301 error code (JWT expired)', () => {
    const error = {
      code: 'PGRST301',
      message: 'JWT expired',
      details: '',
      hint: '',
    } as unknown as PostgrestError;
    expect(isAuthError(error)).toBe(true);
  });

  it('should return true for 401 error code', () => {
    const error = {
      code: '401',
      message: 'Unauthorized',
      details: '',
      hint: '',
    } as unknown as PostgrestError;
    expect(isAuthError(error)).toBe(true);
  });

  it('should return true for 403 error code', () => {
    const error = {
      code: '403',
      message: 'Forbidden',
      details: '',
      hint: '',
    } as unknown as PostgrestError;
    expect(isAuthError(error)).toBe(true);
  });

  it('should return true for error message containing "jwt"', () => {
    const error = new Error('Invalid JWT token');
    expect(isAuthError(error)).toBe(true);
  });

  it('should return true for error message containing "unauthorized"', () => {
    const error = new Error('User is unauthorized');
    expect(isAuthError(error)).toBe(true);
  });

  it('should return true for error message containing "forbidden"', () => {
    const error = new Error('Access forbidden');
    expect(isAuthError(error)).toBe(true);
  });

  it('should return true for error message containing "not authorized"', () => {
    const error = new Error('User is not authorized');
    expect(isAuthError(error)).toBe(true);
  });

  it('should return true for error message containing "session"', () => {
    const error = new Error('Session has expired');
    expect(isAuthError(error)).toBe(true);
  });

  it('should return true for error message containing "token"', () => {
    const error = new Error('Invalid token provided');
    expect(isAuthError(error)).toBe(true);
  });

  it('should return false for non-auth error codes', () => {
    const error = {
      code: '500',
      message: 'Internal server error',
      details: '',
      hint: '',
    } as unknown as PostgrestError;
    expect(isAuthError(error)).toBe(false);
  });

  it('should return false for non-auth error messages', () => {
    const error = new Error('Network connection failed');
    expect(isAuthError(error)).toBe(false);
  });

  it('should handle case-insensitive message matching', () => {
    const error = new Error('JWT TOKEN EXPIRED');
    expect(isAuthError(error)).toBe(true);
  });
});

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GET } from './route';

// Mock @/lib/supabase/server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn(),
  },
  NextRequest: jest.fn(),
}));

describe('Auth Callback Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to /login with error when no code is provided', async () => {
    const mockUrl = 'http://localhost:3000/api/auth/callback';
    const mockRequest = {
      url: mockUrl,
    } as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await GET(mockRequest);

    expect(mockRedirect).toHaveBeenCalledWith(
      new URL('/login?error=auth_callback_failed', 'http://localhost:3000')
    );
  });

  it('should redirect to /login with error when exchangeCodeForSession fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockExchangeCode = jest.fn().mockResolvedValue({
      error: { message: 'Invalid code' },
    });

    createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: mockExchangeCode,
      },
    });

    const mockUrl = 'http://localhost:3000/api/auth/callback?code=invalid-code';
    const mockRequest = {
      url: mockUrl,
    } as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await GET(mockRequest);

    expect(mockExchangeCode).toHaveBeenCalledWith('invalid-code');
    expect(mockRedirect).toHaveBeenCalledWith(
      new URL('/login?error=auth_callback_failed', 'http://localhost:3000')
    );
  });

  it('should redirect to /notebook when exchangeCodeForSession succeeds and no next param', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockExchangeCode = jest.fn().mockResolvedValue({
      error: null,
      data: { session: { access_token: 'test-token' } },
    });

    createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: mockExchangeCode,
      },
    });

    const mockUrl = 'http://localhost:3000/api/auth/callback?code=valid-code';
    const mockRequest = {
      url: mockUrl,
    } as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await GET(mockRequest);

    expect(mockExchangeCode).toHaveBeenCalledWith('valid-code');
    expect(mockRedirect).toHaveBeenCalledWith(
      new URL('/notebook', 'http://localhost:3000')
    );
  });

  it('should redirect to next path when exchangeCodeForSession succeeds with next param', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockExchangeCode = jest.fn().mockResolvedValue({
      error: null,
      data: { session: { access_token: 'test-token' } },
    });

    createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: mockExchangeCode,
      },
    });

    const mockUrl =
      'http://localhost:3000/api/auth/callback?code=valid-code&next=/app/notebook/123';
    const mockRequest = {
      url: mockUrl,
    } as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await GET(mockRequest);

    expect(mockExchangeCode).toHaveBeenCalledWith('valid-code');
    expect(mockRedirect).toHaveBeenCalledWith(
      new URL('/app/notebook/123', 'http://localhost:3000')
    );
  });

  it('should handle unexpected errors and redirect to /login with error', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockExchangeCode = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));

    createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: mockExchangeCode,
      },
    });

    const mockUrl = 'http://localhost:3000/api/auth/callback?code=valid-code';
    const mockRequest = {
      url: mockUrl,
    } as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await GET(mockRequest);

    expect(mockExchangeCode).toHaveBeenCalledWith('valid-code');
    expect(mockRedirect).toHaveBeenCalledWith(
      new URL('/login?error=auth_callback_failed', 'http://localhost:3000')
    );
  });

  it('should handle createClient throwing an error', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockRejectedValue(new Error('Supabase client error'));

    const mockUrl = 'http://localhost:3000/api/auth/callback?code=valid-code';
    const mockRequest = {
      url: mockUrl,
    } as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await GET(mockRequest);

    expect(mockRedirect).toHaveBeenCalledWith(
      new URL('/login?error=auth_callback_failed', 'http://localhost:3000')
    );
  });
});

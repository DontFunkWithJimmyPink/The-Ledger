import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { middleware } from './middleware';

// Mock @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
  CookieOptions: {},
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
  NextRequest: jest.fn(),
}));

describe('middleware', () => {
  const mockUrl = 'http://localhost:3000/app/notebook';
  const mockNextUrl = {
    pathname: '/app/notebook',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('should redirect to /login when Supabase URL is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const mockRequest = {
      url: mockUrl,
      nextUrl: mockNextUrl,
      cookies: {
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
      },
      headers: new Headers(),
    } as unknown as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await middleware(mockRequest);

    expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockUrl));
  });

  it('should redirect to /login when Supabase anon key is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const mockRequest = {
      url: mockUrl,
      nextUrl: mockNextUrl,
      cookies: {
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
      },
      headers: new Headers(),
    } as unknown as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await middleware(mockRequest);

    expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockUrl));
  });

  it('should redirect to /login with next parameter when user is not authenticated', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });

    createServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    const mockRequest = {
      url: mockUrl,
      nextUrl: mockNextUrl,
      cookies: {
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
      },
      headers: new Headers(),
    } as unknown as NextRequest;

    const mockRedirect = jest.fn().mockReturnValue({ type: 'redirect' });
    (NextResponse.redirect as jest.Mock) = mockRedirect;

    await middleware(mockRequest);

    expect(mockGetUser).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/login',
        search: '?next=%2Fapp%2Fnotebook',
      })
    );
  });

  it('should allow request to proceed when user is authenticated', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    });

    createServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    const mockRequest = {
      url: mockUrl,
      nextUrl: mockNextUrl,
      cookies: {
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
      },
      headers: new Headers(),
    } as unknown as NextRequest;

    const mockNext = jest.fn().mockReturnValue({ type: 'next' });
    (NextResponse.next as jest.Mock) = mockNext;

    const result = await middleware(mockRequest);

    expect(mockGetUser).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
    expect(result).toEqual({ type: 'next' });
  });

  it('should handle cookie operations correctly', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    });

    let capturedCookieOptions: any;
    createServerClient.mockImplementation(
      (_url: string, _key: string, options: any) => {
        capturedCookieOptions = options.cookies;
        return {
          auth: {
            getUser: mockGetUser,
          },
        };
      }
    );

    const mockCookies = {
      getAll: jest
        .fn()
        .mockReturnValue([{ name: 'session-cookie', value: 'test-session' }]),
      set: jest.fn(),
    };

    const mockRequest = {
      url: mockUrl,
      nextUrl: mockNextUrl,
      cookies: mockCookies,
      headers: new Headers(),
    } as unknown as NextRequest;

    const mockNext = jest.fn().mockReturnValue({
      type: 'next',
      cookies: {
        set: jest.fn(),
      },
    });
    (NextResponse.next as jest.Mock) = mockNext;

    await middleware(mockRequest);

    expect(capturedCookieOptions).toBeDefined();
    expect(capturedCookieOptions.getAll).toBeDefined();
    expect(capturedCookieOptions.setAll).toBeDefined();

    // Test getAll
    const getAllResult = capturedCookieOptions.getAll();
    expect(getAllResult).toEqual([
      { name: 'session-cookie', value: 'test-session' },
    ]);
    expect(mockCookies.getAll).toHaveBeenCalled();
  });
});

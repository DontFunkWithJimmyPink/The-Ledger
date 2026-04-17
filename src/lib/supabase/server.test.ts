import { createClient } from './server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Mock the @supabase/ssr module
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('createClient (server)', () => {
  const originalEnv = process.env;
  let mockServerClient: ReturnType<typeof createServerClient>;
  let mockCookieStore: {
    getAll: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };

    // Create a mock cookie store
    mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };

    // Mock the cookies function to return our mock cookie store
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

    // Create a mock server client
    mockServerClient = {
      auth: {},
      from: jest.fn(),
    } as unknown as ReturnType<typeof createServerClient>;

    (createServerClient as jest.Mock).mockReturnValue(mockServerClient);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should create a Supabase server client with environment variables', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const client = await createClient();

    expect(cookies).toHaveBeenCalled();
    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
    expect(client).toBe(mockServerClient);
  });

  it('should throw an error if NEXT_PUBLIC_SUPABASE_URL is not set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    await expect(createClient()).rejects.toThrow(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.'
    );
  });

  it('should throw an error if NEXT_PUBLIC_SUPABASE_ANON_KEY is not set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

    await expect(createClient()).rejects.toThrow(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables.'
    );
  });

  it('should throw an error if both environment variables are not set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

    await expect(createClient()).rejects.toThrow(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.'
    );
  });

  it('should configure cookies with getAll method that calls cookieStore.getAll', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const mockCookies = [
      { name: 'sb-access-token', value: 'token123' },
      { name: 'sb-refresh-token', value: 'refresh456' },
    ];
    mockCookieStore.getAll.mockReturnValue(mockCookies);

    await createClient();

    // Get the cookies config passed to createServerClient
    const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
      .cookies;

    // Test the getAll method
    const result = cookiesConfig.getAll();
    expect(mockCookieStore.getAll).toHaveBeenCalled();
    expect(result).toEqual(mockCookies);
  });

  it('should configure cookies with setAll method that calls cookieStore.set for each cookie', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    await createClient();

    // Get the cookies config passed to createServerClient
    const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
      .cookies;

    // Test the setAll method
    const cookiesToSet = [
      {
        name: 'sb-access-token',
        value: 'newtoken123',
        options: { httpOnly: true },
      },
      {
        name: 'sb-refresh-token',
        value: 'newrefresh456',
        options: { httpOnly: true },
      },
    ];

    cookiesConfig.setAll(cookiesToSet);

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'sb-access-token',
      'newtoken123',
      { httpOnly: true }
    );
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'sb-refresh-token',
      'newrefresh456',
      { httpOnly: true }
    );
  });

  it('should handle errors gracefully in setAll when called from Server Component', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    // Mock set to throw an error (simulating Server Component context)
    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Cannot set cookies in Server Component');
    });

    await createClient();

    // Get the cookies config passed to createServerClient
    const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
      .cookies;

    // Test the setAll method - should not throw
    const cookiesToSet = [
      {
        name: 'sb-access-token',
        value: 'newtoken123',
        options: { httpOnly: true },
      },
    ];

    expect(() => cookiesConfig.setAll(cookiesToSet)).not.toThrow();
  });
});

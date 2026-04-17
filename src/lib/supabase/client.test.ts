import { createClient } from './client';
import { createBrowserClient } from '@supabase/ssr';

// Mock the @supabase/ssr module
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}));

describe('createClient', () => {
  const originalEnv = process.env;
  let mockBrowserClient: ReturnType<typeof createBrowserClient>;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };

    // Create a mock client
    mockBrowserClient = {
      auth: {},
      from: jest.fn(),
    } as unknown as ReturnType<typeof createBrowserClient>;

    (createBrowserClient as jest.Mock).mockReturnValue(mockBrowserClient);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should create a Supabase client with environment variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const client = createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
    expect(client).toBe(mockBrowserClient);
  });

  it('should throw an error if NEXT_PUBLIC_SUPABASE_URL is not set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    expect(() => createClient()).toThrow(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.'
    );
  });

  it('should throw an error if NEXT_PUBLIC_SUPABASE_ANON_KEY is not set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

    expect(() => createClient()).toThrow(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables.'
    );
  });

  it('should throw an error if both environment variables are not set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

    expect(() => createClient()).toThrow(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.'
    );
  });
});

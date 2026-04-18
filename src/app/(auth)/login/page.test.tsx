import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPage from './page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
  });

  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('The Ledger')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should display error message from search params', () => {
    mockGet.mockReturnValue('auth_callback_failed');
    render(<LoginPage />);

    expect(
      screen.getByText('Authentication failed. Please try again.')
    ).toBeInTheDocument();
  });

  it('should handle successful sign in', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });

    createClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/notebook');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should redirect to next param after successful sign in', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });

    createClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    mockGet.mockImplementation((key: string) => {
      if (key === 'next') return '/custom-page';
      return null;
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-page');
    });
  });

  it('should display error message on failed sign in', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignIn = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });

    createClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignIn = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: { session: {} }, error: null }),
              100
            )
          )
      );

    createClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Check that button text changes and inputs are disabled
    expect(
      screen.getByRole('button', { name: 'Signing in...' })
    ).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('should have links to register and recover pages', () => {
    render(<LoginPage />);

    expect(screen.getByText('Create an account')).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getByText('Forgot password?')).toHaveAttribute(
      'href',
      '/recover'
    );
  });

  it('should handle unexpected errors', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignIn = jest.fn().mockRejectedValue(new Error('Network error'));

    createClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });
  });
});

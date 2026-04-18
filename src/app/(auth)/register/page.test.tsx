import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import RegisterPage from './page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('RegisterPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should render registration form', () => {
    render(<RegisterPage />);

    expect(screen.getByText('The Ledger')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create account' })
    ).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    createClient.mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });

    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/api/auth/callback',
        },
      });
    });

    // Should show success message
    expect(screen.getByText('Check your email')).toBeInTheDocument();
    expect(
      screen.getByText(/We've sent you an email with a confirmation link/)
    ).toBeInTheDocument();
  });

  it('should validate password confirmation', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345');
    await user.type(confirmPasswordInput, '12345');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 6 characters long')
      ).toBeInTheDocument();
    });
  });

  it('should display error message on failed registration', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });

    createClient.mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });

    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { user: {} }, error: null }), 100)
        )
    );

    createClient.mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });

    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Check that button text changes and inputs are disabled
    expect(
      screen.getByRole('button', { name: 'Creating account...' })
    ).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
  });

  it('should have link to login page', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Sign in')).toHaveAttribute('href', '/login');
  });

  it('should handle unexpected errors', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockRejectedValue(new Error('Network error'));

    createClient.mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });

    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });
  });
});

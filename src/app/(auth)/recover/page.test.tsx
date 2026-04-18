import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import RecoverPage from './page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('RecoverPage', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
  });

  describe('Reset request mode', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(null);
    });

    it('should render password reset request form', () => {
      render(<RecoverPage />);

      expect(screen.getByText('The Ledger')).toBeInTheDocument();
      expect(screen.getByText('Reset your password')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Send reset link' })
      ).toBeInTheDocument();
    });

    it('should handle successful reset request', async () => {
      const { createClient } = require('@/lib/supabase/client');
      const mockResetPassword = jest.fn().mockResolvedValue({
        error: null,
      });

      createClient.mockReturnValue({
        auth: {
          resetPasswordForEmail: mockResetPassword,
        },
      });

      const user = userEvent.setup();
      render(<RecoverPage />);

      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', {
        name: 'Send reset link',
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com', {
          redirectTo: 'http://localhost:3000/recover?type=recovery',
        });
      });

      // Should show success message
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(
        screen.getByText(/We've sent you an email with a password reset link/)
      ).toBeInTheDocument();
    });

    it('should display error message on failed reset request', async () => {
      const { createClient } = require('@/lib/supabase/client');
      const mockResetPassword = jest.fn().mockResolvedValue({
        error: { message: 'User not found' },
      });

      createClient.mockReturnValue({
        auth: {
          resetPasswordForEmail: mockResetPassword,
        },
      });

      const user = userEvent.setup();
      render(<RecoverPage />);

      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', {
        name: 'Send reset link',
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    it('should have link back to login page', () => {
      render(<RecoverPage />);

      expect(screen.getByText('Back to sign in')).toHaveAttribute(
        'href',
        '/login'
      );
    });
  });

  describe('Password update mode', () => {
    beforeEach(() => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'type') return 'recovery';
        return null;
      });
    });

    it('should render password update form when in recovery mode', () => {
      render(<RecoverPage />);

      expect(screen.getByText('The Ledger')).toBeInTheDocument();
      expect(screen.getByText('Set new password')).toBeInTheDocument();
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Update password' })
      ).toBeInTheDocument();
    });

    it('should handle successful password update', async () => {
      const { createClient } = require('@/lib/supabase/client');
      const mockUpdateUser = jest.fn().mockResolvedValue({
        error: null,
      });

      createClient.mockReturnValue({
        auth: {
          updateUser: mockUpdateUser,
        },
      });

      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(<RecoverPage />);

      const newPasswordInput = screen.getByLabelText('New password');
      const confirmPasswordInput = screen.getByLabelText(
        'Confirm new password'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Update password',
      });

      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: 'newpassword123',
        });
      });

      // Should show success message
      expect(screen.getByText('Password updated')).toBeInTheDocument();

      // Should redirect after timeout
      jest.advanceTimersByTime(2000);
      expect(mockPush).toHaveBeenCalledWith('/notebook');

      jest.useRealTimers();
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();
      render(<RecoverPage />);

      const newPasswordInput = screen.getByLabelText('New password');
      const confirmPasswordInput = screen.getByLabelText(
        'Confirm new password'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Update password',
      });

      await user.type(newPasswordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should validate password length', async () => {
      const user = userEvent.setup();
      render(<RecoverPage />);

      const newPasswordInput = screen.getByLabelText('New password');
      const confirmPasswordInput = screen.getByLabelText(
        'Confirm new password'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Update password',
      });

      await user.type(newPasswordInput, '12345');
      await user.type(confirmPasswordInput, '12345');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters long')
        ).toBeInTheDocument();
      });
    });

    it('should display error message on failed password update', async () => {
      const { createClient } = require('@/lib/supabase/client');
      const mockUpdateUser = jest.fn().mockResolvedValue({
        error: { message: 'Session expired' },
      });

      createClient.mockReturnValue({
        auth: {
          updateUser: mockUpdateUser,
        },
      });

      const user = userEvent.setup();
      render(<RecoverPage />);

      const newPasswordInput = screen.getByLabelText('New password');
      const confirmPasswordInput = screen.getByLabelText(
        'Confirm new password'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Update password',
      });

      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Session expired')).toBeInTheDocument();
      });
    });
  });

  it('should handle unexpected errors', async () => {
    const { createClient } = require('@/lib/supabase/client');
    const mockResetPassword = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));

    createClient.mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPassword,
      },
    });

    const user = userEvent.setup();
    render(<RecoverPage />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', {
      name: 'Send reset link',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });
  });
});

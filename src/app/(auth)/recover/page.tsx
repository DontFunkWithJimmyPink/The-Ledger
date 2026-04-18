'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function RecoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // Check if this is a password recovery confirmation (from email link)
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
  }, [searchParams]);

  const handleResetRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/recover?type=recovery`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to notebook after successful password update
      setTimeout(() => {
        router.push('/notebook');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Password reset request form
  if (!isRecoveryMode) {
    if (success) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h1 className="text-center text-3xl font-serif font-bold text-ink-900">
                The Ledger
              </h1>
              <h2 className="mt-6 text-center text-2xl font-serif text-ink-900">
                Check your email
              </h2>
            </div>

            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                We've sent you an email with a password reset link. Please check
                your inbox and click the link to reset your password.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="font-medium text-leather-700 hover:text-leather-900"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-center text-3xl font-serif font-bold text-ink-900">
              The Ledger
            </h1>
            <h2 className="mt-6 text-center text-2xl font-serif text-ink-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-ink-500">
              Enter your email address and we'll send you a password reset link.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleResetRequest}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </Button>

            <div className="text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-leather-700 hover:text-leather-900"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Password update form (shown after clicking email link)
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-center text-3xl font-serif font-bold text-ink-900">
              The Ledger
            </h1>
            <h2 className="mt-6 text-center text-2xl font-serif text-ink-900">
              Password updated
            </h2>
          </div>

          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Your password has been successfully updated. Redirecting you to your
              notebook...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-serif font-bold text-ink-900">
            The Ledger
          </h1>
          <h2 className="mt-6 text-center text-2xl font-serif text-ink-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-ink-500">
            Enter your new password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handlePasswordUpdate}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />

            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating password...' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

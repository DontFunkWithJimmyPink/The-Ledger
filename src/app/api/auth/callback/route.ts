import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth callback Route Handler for Supabase OAuth flow.
 *
 * This handler processes the OAuth callback from Supabase auth providers.
 * It exchanges the `code` query parameter for a session cookie and redirects
 * the user to the appropriate page.
 *
 * Flow:
 * 1. Extract `code` and `next` query parameters from the URL
 * 2. Exchange the code for a session using Supabase
 * 3. On success: redirect to the `next` path (defaults to /notebook)
 * 4. On failure: redirect to /login with an error parameter
 *
 * @param request - The incoming Next.js request
 * @returns NextResponse with redirect to either the success or error page
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/notebook';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error.message);
        return NextResponse.redirect(
          new URL('/login?error=auth_callback_failed', requestUrl.origin)
        );
      }

      // Successfully exchanged code for session
      // Redirect to the next path
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(
        new URL('/login?error=auth_callback_failed', requestUrl.origin)
      );
    }
  }

  // No code present, redirect to login with error
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_failed', requestUrl.origin)
  );
}

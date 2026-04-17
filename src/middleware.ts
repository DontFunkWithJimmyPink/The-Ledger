import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js middleware that validates authentication for protected routes.
 *
 * This middleware runs on every request matching the config.matcher pattern (/(app)/*).
 * It validates the user's session cookie using the Supabase server client and redirects
 * unauthenticated requests to the /login page.
 *
 * @param request - The incoming Next.js request
 * @returns NextResponse with either the original request (authenticated) or redirect to /login
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are not configured');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Create a response object to pass to Supabase
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase server client with cookie handling
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validate the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user is found, redirect to login
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    // Preserve the original URL as a query parameter for post-login redirect
    redirectUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated, allow the request to proceed
  return response;
}

/**
 * Middleware configuration
 *
 * This matcher ensures the middleware only runs on authenticated routes under (app)/
 * and excludes static assets, API routes (except our protected ones), and other special Next.js paths.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths under (app)/ route group
     * Excludes:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/(app)/:path*',
  ],
};

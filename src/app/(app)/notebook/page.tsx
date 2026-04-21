import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui';
import { generateKeyBetween } from '@/lib/utils/fractional-index';
import type { Page } from '@/types';
import { PageListWrapper } from './PageListWrapper';

/**
 * Notebook Home Page - Server Component
 *
 * Fetches all pages for the user's notebook (ordered by sort_order by default).
 * Renders list of PageListItem components.
 * Includes "New Page" button that creates a new page and redirects to it.
 * Supports URL search params for sorting: sortBy and direction
 * Supports URL search param for search: q (keyword search)
 */
export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; direction?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?next=/notebook');
  }

  // Fetch user's notebook
  const { data: notebook, error: notebookError } = await supabase
    .from('notebooks')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (notebookError || !notebook) {
    // If no notebook exists, this is an error state
    // (notebooks should be auto-created on signup)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-ink-500 text-lg">
          Unable to load your notebook. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Determine sort parameters from URL search params
  const sortBy =
    (params.sortBy as
      | 'sort_order'
      | 'created_at'
      | 'updated_at'
      | 'title'
      | undefined) || 'sort_order';
  const direction = (params.direction as 'asc' | 'desc' | undefined) || 'asc';
  const ascending = direction === 'asc';
  const searchQuery = params.q?.trim() || '';

  // Fetch pages: use search RPC if query exists, otherwise fetch all pages
  let pages: Page[] | null = null;
  let pagesError = null;

  if (searchQuery) {
    // Use RPC search function for keyword search
    const { data, error } = await supabase.rpc('search_pages', {
      search_query: searchQuery,
    });
    pages = data as Page[] | null;
    pagesError = error;
  } else {
    // Fetch all pages for this notebook, ordered by selected criteria
    const { data, error } = await supabase
      .from('pages')
      .select('id, title, content, sort_order, updated_at, created_at')
      .eq('notebook_id', notebook.id)
      .order(sortBy, { ascending });
    pages = data as Page[] | null;
    pagesError = error;
  }

  if (pagesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-ink-500 text-lg">
          Unable to load your pages. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Server action to create a new page
  async function createNewPage() {
    'use server';

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login?next=/notebook');
    }

    // Fetch user's notebook
    const { data: notebook } = await supabase
      .from('notebooks')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!notebook) {
      return;
    }

    // Fetch the first existing page to determine the new sort_order
    const { data: existingPages } = await supabase
      .from('pages')
      .select('sort_order')
      .eq('notebook_id', notebook.id)
      .order('sort_order')
      .limit(1);

    // Generate a sort_order that comes before the first page (or 'a0' if no pages exist)
    const firstSortOrder =
      existingPages && existingPages.length > 0
        ? existingPages[0].sort_order
        : null;
    const newSortOrder = generateKeyBetween(null, firstSortOrder);

    // Create the new page
    const { data: newPage, error: insertError } = await supabase
      .from('pages')
      .insert({
        notebook_id: notebook.id,
        title: 'Untitled',
        content: {},
        sort_order: newSortOrder,
      })
      .select('id')
      .single();

    if (insertError || !newPage) {
      // If there's an error, stay on the current page
      return;
    }

    // Redirect to the new page
    redirect(`/notebook/${newPage.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-ink-900">
          Your Notebook
        </h1>

        {/* New Page Button */}
        <form action={createNewPage}>
          <Button type="submit" variant="primary">
            <svg
              className="w-5 h-5 mr-2 -ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Page
          </Button>
        </form>
      </div>

      {/* Page List */}
      {pages && pages.length > 0 ? (
        <PageListWrapper pages={pages as Page[]} searchQuery={searchQuery} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          {searchQuery ? (
            <p className="text-ink-500 text-lg mb-4">
              No pages found for &apos;{searchQuery}&apos;
            </p>
          ) : (
            <>
              <p className="text-ink-500 text-lg mb-4">
                Your notebook is empty — create your first page
              </p>
              <form action={createNewPage}>
                <Button type="submit" variant="primary">
                  <svg
                    className="w-5 h-5 mr-2 -ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create First Page
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

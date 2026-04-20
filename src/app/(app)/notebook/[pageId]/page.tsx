import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Page, Drawing } from '@/types';
import { PageEditor } from '@/components/editor/PageEditor';

interface PageEditorRouteProps {
  params: Promise<{ pageId: string }>;
}

/**
 * Page Editor Route — Server Component
 *
 * Fetches full page data and drawing data via Supabase and passes initial content to PageEditor client component.
 * Displays page title with inline editing.
 */
export default async function PageEditorRoute({
  params,
}: PageEditorRouteProps) {
  const { pageId } = await params;
  const supabase = await createClient();

  // Fetch full page data
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single();

  // Handle errors and missing pages
  if (error || !page) {
    notFound();
  }

  // Fetch drawing data for this page
  const { data: drawing } = await supabase
    .from('drawings')
    .select('*')
    .eq('page_id', pageId)
    .maybeSingle();

  return (
    <div className="h-full flex flex-col">
      <PageEditor
        pageId={page.id}
        initialPage={page as Page}
        initialDrawing={drawing as Drawing | null}
      />
    </div>
  );
}

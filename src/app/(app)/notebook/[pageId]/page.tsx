import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Page, Drawing, Label } from '@/types';
import { PageEditor } from '@/components/editor/PageEditor';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface PageEditorRouteProps {
  params: Promise<{ pageId: string }>;
}

/**
 * Page Editor Route — Server Component
 *
 * Fetches full page data, drawing data, and assigned labels via Supabase and passes initial content to PageEditor client component.
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

  // Fetch all user labels
  const { data: allLabels } = await supabase
    .from('labels')
    .select('*')
    .order('name');

  // Fetch assigned labels for this page
  const { data: pageLabels } = await supabase
    .from('page_labels')
    .select('labels(*)')
    .eq('page_id', pageId);

  // Extract assigned labels from the join result
  const assignedLabels: Label[] =
    pageLabels
      ?.map((pl: any) => pl.labels)
      .filter((label): label is Label => label !== null) || [];

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary fallbackMessage="Something went wrong with the editor — your content is safe">
        <PageEditor
          pageId={page.id}
          initialPage={page as Page}
          initialDrawing={drawing as Drawing | null}
          allLabels={(allLabels as Label[]) || []}
          assignedLabels={assignedLabels}
        />
      </ErrorBoundary>
    </div>
  );
}

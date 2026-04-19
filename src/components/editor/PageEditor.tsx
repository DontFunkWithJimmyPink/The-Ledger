'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAutosave } from '@/lib/hooks/use-autosave';
import { extractTaskItems } from '@/lib/utils/content';
import { CustomTaskItem } from '@/components/editor/extensions/CustomTaskItem';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Page } from '@/types';
import toast from 'react-hot-toast';

export interface PageEditorProps {
  pageId: string;
  initialPage: Page;
}

/**
 * PageEditor Component
 *
 * Client component that initializes Tiptap editor with StarterKit, TaskList,
 * CustomTaskItem (with dueDate support), Image, and Placeholder extensions.
 * Wires content changes to useAutosave for debounced saving. Handles inline
 * title editing with debounced updates.
 */
export function PageEditor({ pageId, initialPage }: PageEditorProps) {
  const [title, setTitle] = useState<string>(initialPage.title);
  const [content, setContent] = useState<Record<string, any>>(
    initialPage.content
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Initialize Tiptap editor
  // T035: StarterKit configuration ensures all required extensions are enabled:
  // - heading (levels 1-3) - explicitly configured below
  // - bold, italic, blockquote, bulletList, orderedList, hardBreak, horizontalRule
  //   are all enabled by default in StarterKit (not explicitly disabled)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // All other StarterKit extensions enabled by default:
        // bold, italic, blockquote, bulletList, orderedList, hardBreak,
        // horizontalRule, paragraph, text, code, codeBlock, strike, history, etc.
      }),
      TaskList,
      CustomTaskItem.configure({
        nested: true,
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Start writing…',
      }),
    ],
    content: initialPage.content,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setContent(json);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none min-h-[400px] p-4',
      },
    },
  });

  // Autosave content changes
  const { status: contentStatus, trigger: triggerContentSave } = useAutosave({
    onSave: async () => {
      // Update page content
      const { error: pageError } = await supabase
        .from('pages')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId);

      if (pageError) {
        console.error('Failed to save page content:', pageError);
        throw pageError;
      }

      // Extract and sync tasks
      const taskItems = extractTaskItems(content);
      const activeIndexes = taskItems.map((item) => item.index);

      // Upsert tasks
      if (taskItems.length > 0) {
        const tasksToUpsert = taskItems.map((item, idx) => ({
          page_id: pageId,
          task_index: item.index,
          text: item.text,
          checked: item.checked,
          sort_order: `${idx}`, // Simple ordering for now
        }));

        const { error: upsertError } = await supabase
          .from('tasks')
          .upsert(tasksToUpsert, {
            onConflict: 'page_id,task_index',
          });

        if (upsertError) {
          console.error('Failed to upsert tasks:', upsertError);
        }
      }

      // Delete orphaned tasks
      if (activeIndexes.length > 0) {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('page_id', pageId)
          .not('task_index', 'in', `(${activeIndexes.join(',')})`);

        if (deleteError) {
          console.error('Failed to delete orphaned tasks:', deleteError);
        }
      } else {
        // No active tasks, delete all tasks for this page
        const { error: deleteAllError } = await supabase
          .from('tasks')
          .delete()
          .eq('page_id', pageId);

        if (deleteAllError) {
          console.error('Failed to delete all tasks:', deleteAllError);
        }
      }
    },
    delay: 500,
    jitter: 100, // Add ±50ms jitter to prevent request storms when multiple pages are open
  });

  // Trigger autosave when content changes
  useEffect(() => {
    if (content !== initialPage.content) {
      triggerContentSave();
    }
  }, [content, triggerContentSave, initialPage.content]);

  // Debounced title update
  useEffect(() => {
    if (title === initialPage.title) return;

    const timer = setTimeout(async () => {
      const { error } = await supabase
        .from('pages')
        .update({ title })
        .eq('id', pageId);

      if (error) {
        console.error('Failed to update title:', error);
        toast.error('Failed to update title');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, pageId, supabase, initialPage.title]);

  // Update browser title
  useEffect(() => {
    document.title = title ? `${title} — The Ledger` : 'The Ledger';
  }, [title]);

  // Show toast on persistent error
  useEffect(() => {
    if (contentStatus === 'error') {
      toast.error('Save failed — retrying');
    }
  }, [contentStatus]);

  // Handle page deletion
  const handleDeletePage = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('pages').delete().eq('id', pageId);

      if (error) {
        console.error('Failed to delete page:', error);
        toast.error('Failed to delete page');
        setIsDeleting(false);
        return;
      }

      toast.success('Page deleted');
      router.push('/notebook');
    } catch (err) {
      console.error('Error deleting page:', err);
      toast.error('Failed to delete page');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title input with inline editing */}
      <div className="border-b border-leather-300 px-4 py-4 flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-3xl font-serif font-bold text-ink-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-ink-500"
          placeholder="Untitled"
        />
        <Button
          variant="ghost"
          onClick={() => setIsDeleteModalOpen(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          aria-label="Delete page"
        >
          Delete
        </Button>
      </div>

      {/* Editor Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Save status indicator */}
      <div className="px-4 py-2 border-b border-leather-300 bg-cream-100">
        <div className="flex items-center gap-2">
          {contentStatus === 'saving' && (
            <span className="text-xs text-ink-500">Saving…</span>
          )}
          {contentStatus === 'saved' && (
            <span className="text-xs text-ink-500">Saved</span>
          )}
          {contentStatus === 'error' && (
            <span className="text-xs text-red-600">Save failed — retrying</span>
          )}
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto bg-cream-50">
        <EditorContent editor={editor} />
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Page"
      >
        <div className="space-y-4">
          <p className="text-ink-900">
            Are you sure you want to delete this page? This action cannot be
            undone. All associated tasks, drawings, and photos will also be
            deleted.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeletePage}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

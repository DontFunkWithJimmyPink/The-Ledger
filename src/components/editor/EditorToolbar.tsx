'use client';

import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/Button';
import { PhotoUploadButton } from '@/components/photos/PhotoUploadButton';

export interface EditorToolbarProps {
  editor: Editor | null;
  pageId: string;
}

/**
 * EditorToolbar Component
 *
 * Renders formatting buttons for the Tiptap editor using editor.chain() commands.
 * Shows active state via editor.isActive() for visual feedback.
 * Supports Bold, Italic, Heading 1/2, BulletList, OrderedList, TaskList, BlockQuote toggles,
 * and Photo Upload which inserts images via editor.chain().focus().setImage().
 */
export function EditorToolbar({ editor, pageId }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  const handlePhotoUpload = (signedUrl: string) => {
    editor.chain().focus().setImage({ src: signedUrl }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-leather-300 bg-cream-100">
      {/* Bold */}
      <Button
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1 min-w-0 ${
          editor.isActive('bold') ? 'bg-cream-200' : ''
        }`}
        type="button"
        aria-label="Toggle bold"
        title="Bold (Ctrl+B)"
      >
        <span className="font-bold">B</span>
      </Button>

      {/* Italic */}
      <Button
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1 min-w-0 ${
          editor.isActive('italic') ? 'bg-cream-200' : ''
        }`}
        type="button"
        aria-label="Toggle italic"
        title="Italic (Ctrl+I)"
      >
        <span className="italic">I</span>
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-leather-300 mx-1" />

      {/* Heading 1 */}
      <Button
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-3 py-1 min-w-0 ${
          editor.isActive('heading', { level: 1 }) ? 'bg-cream-200' : ''
        }`}
        type="button"
        aria-label="Toggle heading 1"
        title="Heading 1 (Ctrl+Alt+1)"
      >
        <span className="font-bold">H1</span>
      </Button>

      {/* Heading 2 */}
      <Button
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-3 py-1 min-w-0 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-cream-200' : ''
        }`}
        type="button"
        aria-label="Toggle heading 2"
        title="Heading 2 (Ctrl+Alt+2)"
      >
        <span className="font-bold">H2</span>
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-leather-300 mx-1" />

      {/* Bullet List */}
      <Button
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1 min-w-0 ${
          editor.isActive('bulletList') ? 'bg-cream-200' : ''
        }`}
        type="button"
        aria-label="Toggle bullet list"
        title="Bullet List (Ctrl+Shift+8)"
      >
        <span>•</span>
      </Button>

      {/* Ordered List */}
      <Button
        variant="ghost"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1 min-w-0 ${
          editor.isActive('orderedList') ? 'bg-cream-200' : ''
        }`}
        type="button"
        aria-label="Toggle ordered list"
        title="Ordered List (Ctrl+Shift+7)"
      >
        <span>1.</span>
      </Button>

      {/* Task List */}
      <Button
        variant="ghost"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`px-3 py-1 min-w-0 ${
          editor.isActive('taskList') ? 'bg-cream-200' : ''
        }`}
        type="button"
        aria-label="Toggle task list"
        title="Task List (Ctrl+Shift+9)"
      >
        <span>☑</span>
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-leather-300 mx-1" />

      {/* Block Quote */}
      <Button
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-3 py-1 min-w-0 ${
          editor.isActive('blockquote') ? 'bg-cream-200' : ''
        }`}
        type="button"
        aria-label="Toggle block quote"
        title="Block Quote (Ctrl+Shift+B)"
      >
        <span>&ldquo;</span>
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-leather-300 mx-1" />

      {/* Photo Upload */}
      <PhotoUploadButton pageId={pageId} onUploadSuccess={handlePhotoUpload} />
    </div>
  );
}

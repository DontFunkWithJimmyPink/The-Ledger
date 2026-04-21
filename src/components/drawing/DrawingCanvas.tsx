'use client';

import { Excalidraw } from '@excalidraw/excalidraw';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAutosave } from '@/lib/hooks/use-autosave';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState } from '@excalidraw/excalidraw/types/types';

export interface DrawingCanvasProps {
  pageId: string;
  initialElements?: ExcalidrawElement[];
  initialAppState?: Partial<AppState>;
}

/**
 * DrawingCanvas Component
 *
 * Client component that renders an Excalidraw canvas with autosave functionality.
 * Must be dynamically imported with `next/dynamic` and `ssr: false` because Excalidraw
 * requires browser APIs (Canvas API, IndexedDB) that are not available during SSR.
 *
 * @example
 * ```tsx
 * const DrawingCanvas = dynamic(() => import('@/components/drawing/DrawingCanvas'), {
 *   loading: () => <SkeletonCanvas />,
 *   ssr: false,
 * });
 *
 * <DrawingCanvas
 *   pageId={pageId}
 *   initialElements={drawing?.elements}
 *   initialAppState={drawing?.app_state}
 * />
 * ```
 */
export function DrawingCanvas({
  pageId,
  initialElements = [],
  initialAppState = {},
}: DrawingCanvasProps) {
  const supabase = createClient();
  const [elements, setElements] = useState<ExcalidrawElement[]>(initialElements);
  const [appState, setAppState] = useState<Partial<AppState>>(initialAppState);

  // Autosave drawing changes
  const { status, trigger } = useAutosave({
    onSave: async () => {
      const { error } = await supabase.from('drawings').upsert(
        {
          page_id: pageId,
          elements,
          app_state: appState,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id' }
      );

      if (error) {
        console.error('Failed to save drawing:', error);
        throw error;
      }
    },
    delay: 500,
    jitter: 100,
  });

  // Trigger autosave when elements or appState change
  useEffect(() => {
    if (elements.length > 0 || Object.keys(appState).length > 0) {
      trigger();
    }
  }, [elements, appState, trigger]);

  const handleChange = (
    newElements: readonly ExcalidrawElement[],
    newAppState: AppState
  ) => {
    setElements([...newElements]);
    setAppState(newAppState);
  };

  return (
    <div className="relative w-full h-[500px] border border-leather-300 rounded-lg overflow-hidden">
      <Excalidraw
        initialData={{
          elements: initialElements,
          appState: initialAppState,
        }}
        onChange={handleChange}
      />
      {/* Save status indicator */}
      <div className="absolute bottom-4 right-4 bg-cream-50 px-3 py-1 rounded-md shadow-sm border border-leather-300 pointer-events-none">
        {status === 'saving' && (
          <span className="text-xs text-ink-500">Saving…</span>
        )}
        {status === 'saved' && (
          <span className="text-xs text-ink-500">Saved</span>
        )}
        {status === 'error' && (
          <span className="text-xs text-red-600">Save failed — retrying</span>
        )}
      </div>
    </div>
  );
}

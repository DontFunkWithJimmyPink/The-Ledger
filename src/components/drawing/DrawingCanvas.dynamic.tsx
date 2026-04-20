/**
 * Example usage of DrawingCanvas with next/dynamic
 *
 * This file demonstrates how to properly import the DrawingCanvas component
 * with SSR disabled, as required for Excalidraw integration.
 */

import dynamic from 'next/dynamic';
import { SkeletonCanvas } from '@/components/drawing/SkeletonCanvas';

// Dynamically import DrawingCanvas with ssr: false
// This is required because Excalidraw uses browser-only APIs (Canvas, IndexedDB)
const DrawingCanvas = dynamic(
  () =>
    import('@/components/drawing/DrawingCanvas').then((mod) => ({
      default: mod.DrawingCanvas,
    })),
  {
    loading: () => <SkeletonCanvas />,
    ssr: false,
  }
);

export default DrawingCanvas;

/**
 * SkeletonCanvas Component
 *
 * Loading placeholder for the DrawingCanvas component while the Excalidraw bundle loads.
 * Shows a fixed-height rounded rectangle with an earthy pulsing animation.
 */
export function SkeletonCanvas() {
  return (
    <div
      className="w-full h-[500px] bg-cream-100 rounded-lg animate-pulse border border-leather-300"
      aria-label="Loading drawing canvas"
      role="status"
    >
      <span className="sr-only">Loading drawing canvas...</span>
    </div>
  );
}

// A pulsing bar standing in for text that hasn't loaded yet. Size it to the text it replaces.
export function SkeletonLine({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-surface-container-high ${className}`}
    />
  );
}

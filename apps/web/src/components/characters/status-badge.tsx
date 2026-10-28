import type { CharacterStatus } from '@rme/shared';

const STATUS_STYLES: Record<CharacterStatus, { dot: string; text: string }> = {
  Alive: { dot: 'bg-status-alive', text: 'text-status-alive' },
  Dead: { dot: 'bg-status-dead', text: 'text-status-dead' },
  unknown: { dot: 'bg-status-unknown', text: 'text-status-unknown' },
};

export function StatusBadge({ status }: { status: CharacterStatus }) {
  const styles = STATUS_STYLES[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest/80 px-2 py-0.5 backdrop-blur-sm">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${styles.dot}`} />
      <span className={`text-[10px] font-semibold tracking-wider uppercase ${styles.text}`}>
        {status}
      </span>
    </span>
  );
}

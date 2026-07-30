import { RefreshCw } from 'lucide-react';

export function LoadingStatus({ label }: { label: string }) {
  return (
    <p className="status-view" role="status">
      <span className="status-spinner" aria-hidden="true" />
      {label}
    </p>
  );
}

export function ErrorStatus({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="status-view" role="status">
      <span>{message}</span>
      {onRetry === undefined ? null : (
        <button
          type="button"
          className="icon-button"
          aria-label="重试"
          title="重试"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" size={18} />
        </button>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Copy, Key, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/account/confirm-modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useApiKey } from '@/lib/auth/api-key-context';
import { useConfig } from '@/lib/config/config-context';
import { formatDateTime } from '@/lib/utils/format';

export function useAccountApiKey() {
  const apiKeyState = useApiKey();
  const { config } = useConfig();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const apiBase = config?.api.url ?? '';

  const handleRegen = async () => {
    setRegenOpen(false);
    setBusy(true);
    apiKeyState.clearError();
    const result = await apiKeyState.createApiKey();
    if (result.success && result.apiKey) {
      setRevealed(result.apiKey);
      toast.success('New API key created');
    } else if (result.error) {
      toast.error(result.error);
    }
    setBusy(false);
  };

  const handleRevoke = async () => {
    setRevokeOpen(false);
    setBusy(true);
    apiKeyState.clearError();
    const ok = await apiKeyState.deleteApiKey();
    if (ok) {
      setRevealed(null);
      toast.success('API key revoked');
    }
    setBusy(false);
  };

  return {
    ...apiKeyState,
    revealed,
    regenOpen,
    setRegenOpen,
    revokeOpen,
    setRevokeOpen,
    busy,
    apiBase,
    handleRegen,
    handleRevoke,
  };
}

export function ApiKeyErrorAlert({
  message,
  onClose,
}: {
  message?: string;
  onClose: () => void;
}) {
  if (!message) return null;
  return <Alert type="error" message={message} onClose={onClose} />;
}

export function ApiKeyLoading() {
  return <p className="text-sm text-muted-foreground">Loading…</p>;
}

export function ApiKeyDisplay({
  displayKey,
  createdAt,
  busy,
  onRegenerate,
  onRevoke,
}: {
  displayKey: string;
  createdAt?: string;
  busy: boolean;
  onRegenerate: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised px-3.5 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-muted-foreground">
          <Key className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm tracking-wide text-foreground break-all">{displayKey}</p>
          {createdAt && (
            <p className="mt-1 text-xs text-muted-foreground">Created {formatDateTime(createdAt)}</p>
          )}
        </div>
      </div>
      <div className="flex w-full gap-1.5 sm:w-auto sm:shrink-0">
        <Button
          type="button"
          variant="outline"
          className="flex-1 sm:flex-none"
          disabled={busy}
          onClick={onRegenerate}
        >
          <RefreshCw className="size-3" />
          Regenerate
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="flex-1 sm:flex-none"
          disabled={busy}
          onClick={onRevoke}
        >
          <Trash2 className="size-3" />
          Revoke
        </Button>
      </div>
    </div>
  );
}

export function ApiKeyRevealBanner({ apiKey }: { apiKey: string }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-green">
        Copy your key now — it won&apos;t be shown again
      </p>
      <code className="block break-all rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-foreground">
        {apiKey}
      </code>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          navigator.clipboard.writeText(apiKey);
          toast.success('Copied');
        }}
      >
        <Copy className="size-3.5" />
        Copy
      </Button>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Store this somewhere safe.</strong> We cannot show it again.
      </p>
    </>
  );
}

export function ApiKeyEmptyState({
  busy,
  onGenerate,
}: {
  busy: boolean;
  onGenerate: () => void;
}) {
  return (
    <>
      <span className="text-sm text-muted-foreground">No active key</span>
      <Button type="button" variant="outline" disabled={busy} onClick={onGenerate}>
        Generate key
      </Button>
    </>
  );
}

export function ApiKeyConfirmModals({
  regenOpen,
  revokeOpen,
  onCloseRegen,
  onCloseRevoke,
  onRegen,
  onRevoke,
}: {
  regenOpen: boolean;
  revokeOpen: boolean;
  onCloseRegen: () => void;
  onCloseRevoke: () => void;
  onRegen: () => void;
  onRevoke: () => void;
}) {
  return (
    <>
      <ConfirmModal
        open={regenOpen}
        onClose={onCloseRegen}
        title="Regenerate API key?"
        body={
          <>
            Your current key will be <strong className="text-foreground">invalidated immediately</strong>.
            Any integrations using it will stop working. The new key is shown once — copy it before closing.
          </>
        }
        confirmLabel="Yes, regenerate"
        confirmVariant="warning"
        onConfirm={onRegen}
      />
      <ConfirmModal
        open={revokeOpen}
        onClose={onCloseRevoke}
        title="Revoke API key?"
        body="This permanently invalidates your key. All API calls using it will fail immediately. You can generate a new key afterwards."
        confirmLabel="Revoke key"
        confirmVariant="danger"
        onConfirm={onRevoke}
      />
    </>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ConfirmModal({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  confirmVariant = 'default',
  confirmDisabled = false,
  onConfirm,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  confirmVariant?: 'default' | 'warning' | 'danger';
  confirmDisabled?: boolean;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card size="sm" className="w-full max-w-[400px] shadow-xl">
        <h3 className="text-lg font-semibold leading-snug text-foreground mb-2">{title}</h3>
        <div className="text-sm text-muted-foreground leading-relaxed mb-5">{body}</div>
        {children}
        <div className="flex justify-end gap-2 mt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmVariant === 'danger' ? 'destructive' : 'default'}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

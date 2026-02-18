"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Icons';

interface DeleteConfirmModalProps {
  itemName: string;
  entityLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ itemName, entityLabel, loading, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const capitalizedLabel = entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4 border border-gray-700">
        <h3 className="text-lg font-medium text-red-400 mb-4">Confirm Deletion</h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete the {entityLabel} <span className="font-mono text-white">{itemName}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button className="bg-gray-600 hover:bg-gray-700" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={onConfirm} disabled={loading}>
            {loading && <Spinner className="h-4 w-4 mr-2" />}
            {loading ? 'Deleting...' : `Delete ${capitalizedLabel}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

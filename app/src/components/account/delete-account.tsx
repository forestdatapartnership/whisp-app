'use client';

import { useState } from 'react';
import { AccountField, AccountInput } from '@/components/account/account-field';
import { ConfirmModal } from '@/components/account/confirm-modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/auth-context';
import { deleteUserAccount } from '@/lib/auth/user-actions';
import { formatSystemMessage, SystemCode } from '@/types/system-codes';

type DeleteErrors = {
  password?: string;
  confirm?: string;
  general?: string;
};

export function useDeleteAccount() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [errors, setErrors] = useState<DeleteErrors>({});
  const [busy, setBusy] = useState(false);

  const close = () => {
    setOpen(false);
    setPassword('');
    setConfirmText('');
    setErrors({});
  };

  const clearError = (key: keyof DeleteErrors) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const confirmDelete = async () => {
    const next: DeleteErrors = {};
    if (!password.trim()) next.password = 'Password is required';
    if (confirmText.trim().toLowerCase() !== 'delete') {
      next.confirm = 'Type "delete" to confirm';
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setBusy(true);
    const result = await deleteUserAccount(password);
    if (result.ok) {
      await logout();
    } else {
      if (result.code === SystemCode.USER_INVALID_PASSWORD) {
        setErrors({ password: formatSystemMessage(result.code, result.args) });
      } else {
        setErrors({ general: formatSystemMessage(result.code, result.args) });
      }
      setBusy(false);
    }
  };

  return {
    open,
    setOpen,
    password,
    setPassword,
    confirmText,
    setConfirmText,
    errors,
    clearError,
    close,
    confirmDelete,
    busy,
  };
}

export function DeleteAccountTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="destructive" className="shrink-0" onClick={onClick}>
      Delete account
    </Button>
  );
}

export function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  errors,
  password,
  setPassword,
  confirmText,
  setConfirmText,
  clearError,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  errors: DeleteErrors;
  password: string;
  setPassword: (v: string) => void;
  confirmText: string;
  setConfirmText: (v: string) => void;
  clearError: (key: keyof DeleteErrors) => void;
  busy: boolean;
}) {
  const canConfirm = confirmText.trim().toLowerCase() === 'delete';

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title="Delete your account?"
      body="This will permanently delete your Whisp account, all saved results, and API keys."
      confirmLabel="Delete account"
      confirmVariant="danger"
      confirmDisabled={!canConfirm || busy}
      onConfirm={onConfirm}
    >
      <div className="space-y-3">
        {errors.general && (
          <Alert
            type="error"
            message={errors.general}
            onClose={() => clearError('general')}
          />
        )}
        <AccountField label="Your password" error={errors.password}>
          <AccountInput
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
          />
        </AccountField>
        <AccountField label='Type "delete" to confirm' error={errors.confirm}>
          <AccountInput
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              clearError('confirm');
            }}
            placeholder="delete"
          />
        </AccountField>
      </div>
    </ConfirmModal>
  );
}

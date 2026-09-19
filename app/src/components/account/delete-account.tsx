'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AccountField, AccountInput } from '@/components/account/account-field';
import { ConfirmModal } from '@/components/account/confirm-modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/auth-context';
import { deleteUserAccount } from '@/lib/auth/user-actions';
import { useSystemMessage } from '@/lib/shared/use-system-message';
import { SystemCode } from '@/types/system-codes';

type DeleteErrors = {
  password?: string;
  confirm?: string;
  general?: string;
};

export function useDeleteAccount() {
  const { logout } = useAuth();
  const t = useTranslations('DeleteAccount');
  const systemMessage = useSystemMessage();
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
    if (!password.trim()) next.password = t('passwordRequired');
    if (confirmText.trim().toLowerCase() !== 'delete') {
      next.confirm = t('confirmHint');
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
        setErrors({ password: systemMessage(result.code, result.args) });
      } else {
        setErrors({ general: systemMessage(result.code, result.args) });
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
  const t = useTranslations('DeleteAccount');
  return (
    <Button type="button" variant="destructive" className="shrink-0" onClick={onClick}>
      {t('trigger')}
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
  const t = useTranslations('DeleteAccount');
  const canConfirm = confirmText.trim().toLowerCase() === 'delete';

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title={t('title')}
      body={t('body')}
      confirmLabel={t('trigger')}
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
        <AccountField label={t('passwordLabel')} error={errors.password}>
          <AccountInput
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
          />
        </AccountField>
        <AccountField label={t('confirmHint')} error={errors.confirm}>
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

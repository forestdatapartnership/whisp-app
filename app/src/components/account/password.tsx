'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { changePassword } from '@/lib/auth/user-actions';
import {
  getPasswordErrors,
  isValidPassword,
  PASSWORD_RULES,
} from '@/lib/shared/field-validation';
import { passwordErrorField, type PasswordErrors } from '@/lib/account/password-errors';
import { useSystemMessage } from '@/lib/shared/use-system-message';

export function usePassword() {
  const t = useTranslations('Password');
  const systemMessage = useSystemMessage();
  const [open, setOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [busy, setBusy] = useState(false);

  const clearError = (key: keyof PasswordErrors) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleOpen = () => {
    setOpen((v) => !v);
    setErrors({});
    if (open) {
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    }
  };

  const save = async () => {
    const next: PasswordErrors = {};
    if (!currentPw.trim()) next.current = t('currentRequired');
    if (!isValidPassword(newPw)) {
      const rule = getPasswordErrors(newPw)[0];
      next.new = rule ? t(`rules.${rule}`) : t('invalid');
    }
    if (newPw !== confirmPw) next.confirm = t('mismatch');
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setBusy(true);
    const result = await changePassword(currentPw, newPw);
    if (result.ok) {
      toast.success(t('updated'));
      setOpen(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } else {
      setErrors({ [passwordErrorField(result.code)]: systemMessage(result.code, result.args) });
    }
    setBusy(false);
  };

  return {
    open,
    toggleOpen,
    currentPw,
    setCurrentPw,
    newPw,
    setNewPw,
    confirmPw,
    setConfirmPw,
    errors,
    clearError,
    save,
    busy,
  };
}

export function PasswordChangeToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('Common');
  return (
    <Button type="button" variant="outline" onClick={onToggle}>
      {open ? t('cancel') : t('change')}
    </Button>
  );
}

export function PasswordRulesList() {
  const t = useTranslations('Password');
  return (
    <ul className="text-xs text-muted-foreground space-y-0.5">
      {PASSWORD_RULES.map((r) => (
        <li key={r.rule}>{t(`rules.${r.rule}`)}</li>
      ))}
    </ul>
  );
}

export function PasswordUpdateButton({
  onSave,
  busy,
}: {
  onSave: () => void;
  busy: boolean;
}) {
  const t = useTranslations('Password');
  return (
    <Button type="button" onClick={onSave} disabled={busy}>
      {t('update')}
    </Button>
  );
}

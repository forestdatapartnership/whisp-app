'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { changePassword } from '@/lib/auth/user-actions';
import {
  getPasswordErrors,
  isValidPassword,
  PASSWORD_RULES,
} from '@/lib/shared/field-validation';
import {
  mapPasswordApiError,
  type PasswordErrors,
} from '@/lib/account/password-errors';

export function usePassword() {
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
    if (!currentPw.trim()) next.current = 'Current password is required';
    if (!isValidPassword(newPw)) {
      next.new = getPasswordErrors(newPw)[0] ?? 'Invalid password';
    }
    if (newPw !== confirmPw) next.confirm = 'Passwords do not match';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setBusy(true);
    const result = await changePassword(currentPw, newPw);
    if (result.ok) {
      toast.success('Password updated');
      setOpen(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } else {
      setErrors(mapPasswordApiError(result.code));
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
  return (
    <Button type="button" variant="outline" onClick={onToggle}>
      {open ? 'Cancel' : 'Change'}
    </Button>
  );
}

export function PasswordRulesList() {
  return (
    <ul className="text-xs text-muted-foreground space-y-0.5">
      {PASSWORD_RULES.map((r) => (
        <li key={r.message}>{r.message}</li>
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
  return (
    <Button type="button" onClick={onSave} disabled={busy}>
      Update password
    </Button>
  );
}

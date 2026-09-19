'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/auth-context';
import { updateUserProfile } from '@/lib/auth/user-actions';
import { useSystemMessage } from '@/lib/shared/use-system-message';

export function useProfile() {
  const { user, refreshUser } = useAuth();
  const systemMessage = useSystemMessage();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setLastName(user.last_name ?? '');
      setOrganization(user.organization ?? '');
    }
  }, [user]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      name !== (user.name ?? '') ||
      lastName !== (user.last_name ?? '') ||
      organization !== (user.organization ?? '')
    );
  }, [user, name, lastName, organization]);

  const clearError = () => {
    if (error) setError('');
  };

  const clearSaved = () => {
    if (saved) setSaved(false);
  };

  const save = async () => {
    if (!isDirty) return;
    setBusy(true);
    setError('');
    setSaved(false);
    const result = await updateUserProfile({
      name,
      lastName,
      organization: organization || null,
    });
    if (result.ok) {
      await refreshUser();
      setSaved(true);
    } else {
      setError(systemMessage(result.code, result.args));
    }
    setBusy(false);
  };

  return {
    user,
    name,
    setName,
    lastName,
    setLastName,
    organization,
    setOrganization,
    error,
    clearError,
    clearSaved,
    save,
    busy,
    isDirty,
    saved,
  };
}

export function ProfileErrorAlert({
  error,
  onClose,
}: {
  error: string;
  onClose: () => void;
}) {
  if (!error) return null;
  return <Alert type="error" message={error} onClose={onClose} />;
}

export function ProfileSaveButton({
  onSave,
  busy,
  disabled,
  saved,
}: {
  onSave: () => void;
  busy: boolean;
  disabled?: boolean;
  saved?: boolean;
}) {
  const t = useTranslations('Profile');
  return (
    <div className="flex items-center gap-3">
      {saved && (
        <span className="flex items-center gap-1.5 text-sm font-medium text-accent-green">
          <Check className="size-3.5" aria-hidden />
          {t('saved')}
        </span>
      )}
      <Button type="button" onClick={onSave} disabled={busy || disabled}>
        {t('save')}
      </Button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  fetchNotificationStatus,
  setNotificationSubscription,
} from '@/lib/notifications/actions';
import { formatSystemMessage } from '@/types/system-codes';

export function useNotifications() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetchNotificationStatus().then((r) => {
      if (r.ok) setEnabled(r.data);
    });
  }, []);

  const toggle = async (on: boolean) => {
    setEnabled(on);
    const result = await setNotificationSubscription(on);
    if (!result.ok) {
      setEnabled(!on);
      toast.error(formatSystemMessage(result.code, result.args));
    }
  };

  return { enabled, toggle };
}

export function NotificationToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (on: boolean) => void;
}) {
  return <Switch checked={enabled} onCheckedChange={onToggle} />;
}

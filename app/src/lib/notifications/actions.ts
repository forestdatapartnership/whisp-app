'use server';

import { getAuthUser } from '@/lib/auth/session';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';
import { action } from '@/lib/server/action';
import {
  subscribeNotifications,
  unsubscribeNotifications,
  getNotificationSubscription,
} from '@/lib/db/notifications-service';
import { getUserByUuid } from '@/lib/db/users-service';

export const fetchNotificationStatus = action(async (): Promise<boolean> => {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  const profile = await getUserByUuid(user.id);
  if (!profile) throw new SystemError(SystemCode.USER_NOT_FOUND);
  return getNotificationSubscription(profile.email);
});

export const setNotificationSubscription = action(async (subscribed: boolean): Promise<void> => {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  const profile = await getUserByUuid(user.id);
  if (!profile) throw new SystemError(SystemCode.USER_NOT_FOUND);
  if (subscribed) await subscribeNotifications(profile.email);
  else await unsubscribeNotifications(profile.email);
});

'use server';

import { validateRequiredFields } from '@/lib/utils/fieldValidation';
import { validateEmail } from '@/lib/utils/emailValidation';
import {
  subscribeNotifications as dalSubscribe,
  unsubscribeNotifications as dalUnsubscribe,
} from '@/lib/dal/notificationsService';

export async function subscribeNotifications(email: string): Promise<void> {
  validateRequiredFields({ email }, ['email']);
  const normalized = await validateEmail(email);
  if (!normalized) return;
  await dalSubscribe(normalized);
}

export async function unsubscribeNotifications(email: string): Promise<void> {
  validateRequiredFields({ email }, ['email']);
  const normalized = await validateEmail(email);
  if (!normalized) return;
  await dalUnsubscribe(normalized);
}

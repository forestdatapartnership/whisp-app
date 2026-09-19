import * as rootParams from 'next/root-params';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import type { SystemCode } from '@/types/system-codes';
import { defaultLocale, locales } from './locales';
import en from '../../messages/en.json';

// A SystemCode without a message fails here at compile time instead of showing a raw code to users.
const base = en satisfies { SystemMessages: Record<SystemCode, string> };

type Messages = Record<string, unknown>;

const isMessages = (value: unknown): value is Messages =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Untranslated keys fall back to English instead of rendering as error placeholders.
function withFallback(from: Messages, overrides: Messages): Messages {
  const merged: Messages = { ...from };
  for (const [key, value] of Object.entries(overrides)) {
    const current = merged[key];
    merged[key] = isMessages(value) && isMessages(current) ? withFallback(current, value) : value;
  }
  return merged;
}

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (!hasLocale(locales, paramValue)) notFound();
    locale = paramValue;
  }

  const messages = locale === defaultLocale ? base : withFallback(base, (await import(`../../messages/${locale}.json`)).default);
  return { locale, messages, formats: { dateTime: { short: { dateStyle: 'medium', timeStyle: 'short' } } } };
});

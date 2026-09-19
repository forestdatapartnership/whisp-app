export const locales = ['en', 'es', 'fr', 'pt-BR'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeLabels = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  'pt-BR': 'Português (Brasil)',
} satisfies Record<Locale, string>;

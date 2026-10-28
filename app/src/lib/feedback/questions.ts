export const FEEDBACK_TEXT_MAX_LENGTH = 1000;

// A multiple-choice answer is stored as one comma-separated value, keeping one row per question.
export const FEEDBACK_CHOICE_SEPARATOR = ',';

// The name is stored with each answer, so a question whose meaning changes needs a new name.
export const FEEDBACK_QUESTIONS: { name: string; options?: string[]; stars?: boolean; multiple?: boolean }[] = [
  { name: 'rating', options: ['1', '2', '3', '4', '5'], stars: true },
  {
    name: 'region',
    options: ['africa', 'asia_pacific', 'europe_central_asia', 'latin_america_caribbean', 'near_east_north_africa', 'north_america', 'global'],
    multiple: true,
  },
  {
    name: 'organization',
    options: ['government', 'operator', 'trader', 'producer', 'certification', 'financial', 'digital', 'ngo', 'academia', 'un', 'other'],
  },
  { name: 'use' },
  { name: 'datasets' },
  { name: 'improvement' },
];

const LAST_OPTIONS = ['global', 'other'];

export function sortOptions(options: string[], label: (option: string) => string, locale: string) {
  return [...options].sort(
    (a, b) => LAST_OPTIONS.indexOf(a) - LAST_OPTIONS.indexOf(b) || label(a).localeCompare(label(b), locale)
  );
}

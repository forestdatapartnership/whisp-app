export const FEEDBACK_TEXT_MAX_LENGTH = 1000;

// The name is stored with each answer, so a question whose meaning changes needs a new name.
export const FEEDBACK_QUESTIONS: { name: string; options?: string[]; stars?: boolean }[] = [
  { name: 'rating', options: ['1', '2', '3', '4', '5'], stars: true },
  {
    name: 'region',
    options: ['africa', 'asia_pacific', 'europe_central_asia', 'latin_america_caribbean', 'near_east_north_africa', 'north_america'],
  },
  {
    name: 'organization',
    options: ['government', 'operator', 'trader', 'producer', 'certification', 'financial', 'ngo', 'academia', 'un', 'other'],
  },
  { name: 'use' },
  { name: 'datasets' },
  { name: 'improvement' },
];

export function sortOptions(options: string[], label: (option: string) => string, locale: string) {
  return [...options].sort(
    (a, b) => Number(a === 'other') - Number(b === 'other') || label(a).localeCompare(label(b), locale)
  );
}

export const FEEDBACK_TEXT_MAX_LENGTH = 1000;

// The name is stored with each answer, so a question whose meaning changes needs a new name.
export const FEEDBACK_QUESTIONS: { name: string; options?: string[] }[] = [
  { name: 'usefulness', options: ['1', '2', '3', '4', '5'] },
  { name: 'ease', options: ['1', '2', '3', '4', '5'] },
  { name: 'organization', options: ['government', 'academia', 'private', 'ngo', 'un', 'other'] },
  { name: 'improvement' },
];

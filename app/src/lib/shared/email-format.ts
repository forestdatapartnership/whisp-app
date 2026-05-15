export const validateEmailFormat = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

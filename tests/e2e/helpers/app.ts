import { Page, expect } from '@playwright/test';

const IGNORED_ERROR_PATTERNS = [
  /api\.github\.com/,
];

export function failOnHttpError(page: Page) {
  let reject: (err: Error) => void;
  const promise = new Promise<never>((_, r) => { reject = r; });
  promise.catch(() => {});

  page.on('response', (res) => {
    if (res.status() < 400) return;
    const url = res.url();
    if (IGNORED_ERROR_PATTERNS.some((p) => p.test(url))) return;
    reject(new Error(`HTTP ${res.status()} on ${res.request().method()} ${url}`));
  });

  return {
    race<T>(action: Promise<T>): Promise<T> {
      return Promise.race([action, promise]);
    },
  };
}

export async function waitForAppReady(page: Page) {
  await expect(page.getByText('Loading...')).toBeHidden({ timeout: 30000 });
}

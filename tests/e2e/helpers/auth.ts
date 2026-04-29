import { Page, expect } from '@playwright/test';
import { waitForAppReady, failOnHttpError } from './app';

export async function login(page: Page, email: string, password: string) {
  const monitor = failOnHttpError(page);
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await monitor.race(page.waitForURL('/'));
  await waitForAppReady(page);
}

export async function logout(page: Page) {
  const navbar = page.locator('nav');
  await navbar.getByRole('button').filter({ hasText: /.+/ }).last().click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL('/');
}

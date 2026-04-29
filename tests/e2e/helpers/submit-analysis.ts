import { Page, expect } from '@playwright/test';
import path from 'path';
import { waitForAppReady, failOnHttpError } from './app';

function extractToken(page: Page): string {
  const match = page.url().match(/\/results\/(.+)/);
  if (!match) throw new Error('Could not extract token from URL');
  return match[1];
}

async function waitForResults(page: Page, monitor: ReturnType<typeof failOnHttpError>) {
  await monitor.race(page.waitForURL(/\/results\//, { timeout: 60000 }));
  await monitor.race(expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 120000 }));
  return extractToken(page);
}

export async function submitGeojsonFile(page: Page): Promise<string> {
  const monitor = failOnHttpError(page);
  await page.goto('/');
  await waitForAppReady(page);
  await page.getByRole('button', { name: 'Submit Geometry' }).click();

  const dropzone = page.locator('.border-dashed').first();
  const sampleFile = path.join(__dirname, '../../../public/whisp_example_polys.geojson');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await dropzone.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(sampleFile);

  await expect(page.getByRole('button', { name: 'Analyze' })).toBeEnabled({ timeout: 10000 });
  await page.getByRole('button', { name: 'Analyze' }).click();

  return waitForResults(page, monitor);
}

export async function submitWktFile(page: Page): Promise<string> {
  const monitor = failOnHttpError(page);
  await page.goto('/');
  await waitForAppReady(page);
  await page.getByRole('button', { name: 'Submit Geometry' }).click();

  const dropzone = page.locator('.border-dashed').first();
  const sampleFile = path.join(__dirname, '../../../public/civ_plot_wkt.txt');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await dropzone.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(sampleFile);

  await expect(page.getByRole('button', { name: 'Analyze' })).toBeEnabled({ timeout: 10000 });
  await page.getByRole('button', { name: 'Analyze' }).click();

  return waitForResults(page, monitor);
}

export async function submitGeoIds(page: Page, geoId: string = '6559c619-8524-4b10-8210-7c786967bacf'): Promise<string> {
  const monitor = failOnHttpError(page);
  await page.goto('/');
  await waitForAppReady(page);

  await page.getByRole('button', { name: 'Submit Geo IDs' }).click();
  await expect(page.getByText('Loading...').first()).toBeHidden({ timeout: 30000 });
  await expect(page.getByPlaceholder('Enter one Geo ID per line')).toBeVisible();

  await page.getByPlaceholder('Enter one Geo ID per line').fill(geoId);

  await expect(page.getByRole('button', { name: 'Analyze' })).toBeEnabled();
  await page.getByRole('button', { name: 'Analyze' }).click();

  return waitForResults(page, monitor);
}

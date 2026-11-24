const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
require('../register-typescript.cjs');
const { exportHtmlReport, ReportDownloadError } = require('../../app/src/lib/results/export-html-report.ts');
const downloads = require('../../app/src/lib/utils/export.ts');
const labels = require('../../app/messages/pt-BR.json').Results;
const label = (key, values = {}) => {
  let value = key.split('.').reduce((item, part) => item[part], labels);
  for (const [key, replacement] of Object.entries(values)) value = value.replace('{' + key + '}', replacement);
  return value;
};
const input = {
  local: false, apiUrl: 'http://localhost:8001/api/', token: 'example-token',
  language: 'pt-BR', theme: 'dark', title: 'WHISP risk report · GeoJSON', label,
  rows: [{ plotId: '1', risk_pcrop: 'low' }], columns: [{ key: 'plotId', header: 'Plot ID' }],
};
afterEach(() => mock.restoreAll());

test('remote export uses the public API, locale, theme and attachment filename', async () => {
  const saved = mock.method(downloads, 'downloadBlob', () => {});
  const fetched = mock.method(globalThis, 'fetch', async () => new Response('<html>report</html>', {
    headers: { 'content-type': 'text/html', 'content-disposition': 'attachment; filename="server-report.html"' },
  }));
  await exportHtmlReport(input);
  const [url, options] = fetched.mock.calls[0].arguments;
  assert.equal(url, 'http://localhost:8001/api/results/example-token.html?language=pt-BR&theme=dark');
  assert.equal(options.cache, 'no-store');
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(saved.mock.calls[0].arguments[1], 'server-report.html');
  assert.equal(await saved.mock.calls[0].arguments[0].text(), '<html>report</html>');
});

test('remote export falls back to a timestamp filename when the header is unavailable', async () => {
  const saved = mock.method(downloads, 'downloadBlob', () => {});
  mock.method(globalThis, 'fetch', async () => new Response('report', { headers: { 'content-type': 'text/html' } }));
  await exportHtmlReport(input);
  assert.match(saved.mock.calls[0].arguments[1], /^whisp-report-.*\.html$/);
});

test('404 reports expiry without silently falling back to browser generation', async () => {
  const saved = mock.method(downloads, 'downloadBlob', () => {});
  const local = mock.method(downloads, 'downloadHtml', () => {});
  mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 404 }));
  await assert.rejects(exportHtmlReport(input), error => error instanceof ReportDownloadError && error.reason === 'expired');
  assert.equal(saved.mock.callCount(), 0);
  assert.equal(local.mock.callCount(), 0);
});

test('network failures and unexpected response types report a download error', async () => {
  for (const fetch of [
    async () => { throw new TypeError('Failed to fetch'); },
    async () => new Response('{}', { headers: { 'content-type': 'application/json' } }),
    async () => new Response('error', { status: 500 }),
  ]) {
    mock.method(globalThis, 'fetch', fetch);
    await assert.rejects(exportHtmlReport(input), error => error.reason === 'failed');
    mock.restoreAll();
  }
});

test('timeout aborts a request waiting for response headers', async () => {
  mock.method(globalThis, 'fetch', (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }));
  await assert.rejects(exportHtmlReport({ ...input, timeoutMs: 10 }), error => error.reason === 'timeout');
});

test('timeout also covers a response body that never finishes', async () => {
  mock.method(globalThis, 'fetch', async (_url, options) => ({
    status: 200, ok: true, headers: new Headers({ 'content-type': 'text/html' }),
    blob: () => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }),
  }));
  await assert.rejects(exportHtmlReport({ ...input, timeoutMs: 10 }), error => error.reason === 'timeout');
});

test('local-file export works without API configuration, with locale and CSP in the file', async () => {
  const fetched = mock.method(globalThis, 'fetch', async () => { throw new Error('Must stay local'); });
  const saved = mock.method(downloads, 'downloadHtml', () => {});
  await exportHtmlReport({ ...input, local: true, apiUrl: undefined });
  assert.equal(fetched.mock.callCount(), 0);
  const [html, filename] = saved.mock.calls[0].arguments;
  assert.ok(html.includes('<html lang="pt-BR" data-theme="dark">'));
  assert.ok(html.includes('<meta http-equiv="Content-Security-Policy"'));
  assert.ok(html.includes("default-src 'none'"));
  const data = JSON.parse(html.split('<script type="application/json" id="data">')[1].split('</script>')[0]);
  assert.equal(data.title, input.title);
  assert.equal(data.rows[0].plotId, '1');
  assert.equal(data.commodities[0].label, 'Cultura perene');
  assert.match(filename, /^whisp-report-.*\.html$/);
});

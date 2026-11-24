import asyncio
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from urllib.request import urlopen
from urllib.parse import unquote
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'api'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from playwright.sync_api import sync_playwright, expect
import uvicorn

from src.config import Settings, get_settings
from src.geojson import router as exports


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class BrowserReportTests(unittest.TestCase):
    def test_cross_origin_download_local_file_expiry_and_timeout(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            subprocess.run(['node', str(ROOT / 'tests/browser/build-report-harness.cjs'), directory], check=True)
            malicious = '</script><script>window.injected=true</script>'
            result = {'type': 'FeatureCollection', 'features': [{
                'type': 'Feature', 'geometry': None,
                'properties': {'plotId': '1', 'external_id': malicious, 'risk_pcrop': 'low', 'risk_timber': 'high'},
            }]}
            (folder / 'fixture-result.json').write_text(json.dumps(result))
            settings = Settings(_env_file=None, temp_dir=folder)
            api = FastAPI()
            origins = next(line.split('=', 1)[1] for line in (ROOT / 'api/.env.example').read_text().splitlines()
                           if line.startswith('ALLOWED_ORIGINS='))
            api.add_middleware(CORSMiddleware, allow_origins=origins.split(','), expose_headers=['Content-Disposition'])
            api.dependency_overrides[get_settings] = lambda: settings

            @api.get('/api/config')
            async def config():
                return {'openforisWhispVersion': '3.0.0a25'}

            @api.get('/api/results/slow.html')
            async def slow():
                await asyncio.sleep(0.3)
                return HTMLResponse('<html>slow report</html>')

            api.include_router(exports.router, prefix='/api')

            state = {'delay': 0, 'calls': 0}

            async def fields():
                state['calls'] += 1
                await asyncio.sleep(state['delay'])
                return []

            server = uvicorn.Server(uvicorn.Config(api, host='127.0.0.1', port=8001, log_level='error', lifespan='off'))
            thread = threading.Thread(target=server.run, daemon=True)
            web = ThreadingHTTPServer(('127.0.0.1', 3001), partial(QuietHandler, directory=directory))
            web_thread = threading.Thread(target=web.serve_forever, daemon=True)
            with patch.object(exports, 'fetch_result_fields', fields):
                thread.start()
                web_thread.start()
                try:
                    deadline = time.monotonic() + 10
                    while not server.started:
                        if not thread.is_alive() or time.monotonic() > deadline:
                            self.fail('Fixture API failed to start on port 8001')
                        time.sleep(0.02)
                    with sync_playwright() as playwright:
                        executable = os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium')
                        browser = playwright.chromium.launch(executable_path=executable, args=['--no-sandbox'])
                        try:
                            page = browser.new_page(accept_downloads=True)
                            page.goto('http://localhost:3001')
                            with page.expect_download() as download:
                                page.locator('#remote').click()
                            remote = download.value
                            self.assertRegex(remote.suggested_filename, r'whisp_analysis_.*-report\.html')
                            remote_file = folder / 'downloaded.html'
                            remote.save_as(remote_file)
                            expect(page.locator('#status')).to_have_text('done')
                            self.assertIn('<html lang="pt-BR" data-theme="dark">', remote_file.read_text())
                            print('PASS: cross-origin 3001 -> 8001 download, locale/theme and server filename')

                            page.locator('#expired').click()
                            expect(page.locator('#status')).to_have_text('expired')
                            page.locator('#slow').click()
                            expect(page.locator('#status')).to_have_text('timeout')
                            expect(page.locator('#slow')).to_be_enabled()
                            print('PASS: expired result and timeout release the control')

                            with page.expect_download() as download:
                                page.locator('#local').click()
                            local_file = folder / 'local.html'
                            download.value.save_as(local_file)
                            self.assertIn('<html lang="pt-BR" data-theme="dark">', local_file.read_text())
                            print('PASS: browser-side local-file export')

                            offline = browser.new_page(accept_downloads=True)
                            requests = []
                            offline.on('request', lambda request: requests.append(request.url))
                            offline.goto(remote_file.as_uri())
                            expect(offline.locator('#tabs button')).to_have_count(3)
                            expect(offline.locator('#tbody tr.plot')).to_have_count(1)
                            offline.locator('#tbody tr.plot').click()
                            expect(offline.locator('.details')).to_contain_text(malicious)
                            self.assertIsNone(offline.evaluate('window.injected'))
                            offline.locator('[data-r="high"]').click()
                            expect(offline.locator('#tbody tr.plot')).to_have_count(0)
                            offline.locator('#filter').click()
                            expect(offline.locator('#tbody tr.plot')).to_have_count(1)
                            with offline.expect_download() as csv:
                                offline.locator('#csv').click()
                            csv_file = folder / 'plots.csv'
                            csv.value.save_as(csv_file)
                            self.assertIn('external_id', csv_file.read_text())
                            self.assertFalse(any(url.startswith(('http:', 'https:')) for url in requests))
                            print('PASS: saved HTML works offline under CSP: tabs, filtering, details, CSV and escaped data')
                            next_app = os.environ.get('WHISP_NEXT_APP_DIR')
                            if next_app:
                                web.shutdown()
                                web.server_close()
                                web_thread.join(timeout=5)
                                self.check_results_page(browser, next_app, folder, result, state, server)
                            else:
                                print('NOT RUN: full Next.js page (set WHISP_NEXT_APP_DIR to a built app)')
                        finally:
                            browser.close()
                finally:
                    server.should_exit = True
                    thread.join(timeout=5)
                    web.shutdown()
                    web.server_close()
                    web_thread.join(timeout=5)

    def check_results_page(self, browser, next_app, folder, result, state, server):
        labels = json.loads((ROOT / 'app/messages/pt-BR.json').read_text())['Results']
        env = {**os.environ, 'API_URL': 'http://localhost:8001/api', 'PUBLIC_API_URL': 'http://localhost:8001/api',
               'HOST_URL': 'http://localhost:3001', 'DB_HOST': '127.0.0.1', 'DB_PORT': '1',
               'NEXT_TELEMETRY_DISABLED': '1', 'OPENFORIS_WHISP_VERSION': '3.0.0a25'}
        log_path = folder / 'next.log'
        with log_path.open('w') as log:
            process = subprocess.Popen(['node', str(Path(next_app) / 'node_modules/next/dist/bin/next'),
                                        'start', '--hostname', '127.0.0.1', '--port', '3001'],
                                       cwd=next_app, env=env, stdout=log, stderr=log)
            try:
                deadline = time.monotonic() + 20
                last_error = None
                while True:
                    try:
                        with urlopen('http://localhost:3001/pt-BR/results/fixture', timeout=1) as response:
                            if response.status == 200:
                                break
                    except Exception as error:
                        last_error = error
                    if process.poll() is not None or time.monotonic() > deadline:
                        self.fail(f'Next.js did not become ready: {last_error}\n' + log_path.read_text())
                    time.sleep(0.1)

                page = browser.new_page(accept_downloads=True)
                page.set_default_timeout(15000)
                payload = json.dumps({'code': 'analysis_completed', 'data': result, 'final': True})
                page.route('**/internal/status/**', lambda route: route.fulfill(
                    status=200, content_type='text/event-stream', body=f'data: {payload}\n\n'))
                page.goto('http://localhost:3001/pt-BR/results/fixture')
                menu = page.get_by_role('button', name=labels['download'], exact=True)
                expect(menu).to_be_visible()

                page.evaluate('window.open = url => { window.lastMapUrl = url; return null; }')
                page.get_by_role('button', name=labels['openInWhispMap'], exact=True).click()
                self.assertIn('/api/results/fixture.geojson', unquote(page.evaluate('window.lastMapUrl')))

                state.update(delay=2, calls=0)
                menu.click()
                with page.expect_download() as download:
                    page.get_by_role('menuitem', name=labels['htmlReport'], exact=True).click()
                    pending = page.get_by_role('button', name=labels['htmlExporting'], exact=True)
                    expect(pending).to_be_visible()
                    expect(pending).to_have_attribute('aria-busy', 'true')
                    pending.click()
                    expect(page.get_by_role('menuitem', name=labels['htmlReport'], exact=True)).to_be_disabled()
                download.value.save_as(folder / 'next-remote.html')
                expect(menu).to_be_visible()
                self.assertEqual(state['calls'], 1)
                page.keyboard.press('Escape')
                print('PASS: actual Next.js results toolbar downloads, shows pending state and blocks duplicate clicks; Earth Map URL')

                state['delay'] = 0
                (folder / 'fixture-result.json').unlink()
                menu.click()
                page.get_by_role('menuitem', name=labels['htmlReport'], exact=True).click()
                expect(page.get_by_text(labels['htmlExportExpired'], exact=True)).to_be_visible()
                expect(menu).to_be_visible()
                print('PASS: actual Next.js expiry toast and download state recovery')

                page.evaluate('''async result => {
                    await new Promise((resolve, reject) => {
                        const request = indexedDB.open('whisp', 1);
                        request.onupgradeneeded = () => request.result.createObjectStore('local-results');
                        request.onerror = () => reject(request.error);
                        request.onsuccess = () => {
                            const db = request.result;
                            const transaction = db.transaction('local-results', 'readwrite');
                            transaction.objectStore('local-results').put({featureCollection: result, whispVersion: '3.0.0a25'}, 'pending');
                            transaction.oncomplete = () => { db.close(); resolve(); };
                            transaction.onerror = () => reject(transaction.error);
                        };
                    });
                }''', result)
                page.goto('http://localhost:3001/pt-BR/results/local')
                expect(page.get_by_role('button', name=labels['download'], exact=True)).to_be_visible()
                server.should_exit = True
                with page.expect_download() as download:
                    page.get_by_role('button', name=labels['download'], exact=True).click()
                    page.get_by_role('menuitem', name=labels['htmlReport'], exact=True).click()
                download.value.save_as(folder / 'next-local.html')
                self.assertIn('<html lang="pt-BR"', (folder / 'next-local.html').read_text())
                print('PASS: actual Next.js /results/local export with stored file data and API shut down')
            except Exception:
                print('Next.js fixture log:\n' + log_path.read_text()[-6000:])
                raise
            finally:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()


if __name__ == '__main__':
    unittest.main()

// Run the actual browser report builder against the API test's fixtures.
const fs = require('node:fs');
const path = require('node:path');
require('../register-typescript.cjs');
const app = path.resolve(__dirname, '../../app');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const labels = require(path.join(app, 'messages', input.language + '.json')).Results;
const label = (key, values) => {
  let value = key.split('.').reduce((value, part) => value[part], labels);
  for (const [key, replacement] of Object.entries(values || {})) value = value.replace('{' + key + '}', replacement);
  return value;
};
const { buildOfflineReport } = require(path.join(app, 'src/lib/results/offline-report.ts'));
process.stdout.write(JSON.stringify(buildOfflineReport({
  rows: input.rows, columns: input.columns, title: 'WHISP risk report · ' + input.token,
  theme: 'light', label,
})));

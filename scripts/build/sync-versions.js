const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const version = fs.readFileSync(path.join(repoRoot, '.version'), 'utf-8').trim();

const pkgPath = path.join(repoRoot, 'app', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const pyprojectPath = path.join(repoRoot, 'api', 'pyproject.toml');
let pyproject = fs.readFileSync(pyprojectPath, 'utf-8');
pyproject = pyproject.replace(/^version\s*=\s*".*"/m, `version = "${version}"`);
fs.writeFileSync(pyprojectPath, pyproject);

console.log(`Synced version ${version} to app/package.json and api/pyproject.toml`);

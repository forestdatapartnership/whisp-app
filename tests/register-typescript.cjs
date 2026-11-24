const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require(process.env.TYPESCRIPT_PATH || '../app/node_modules/typescript');
const app = path.resolve(__dirname, '../app');
const resolve = Module._resolveFilename;

Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(app, 'src', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = function (module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, esModuleInterop: true },
  }).outputText, filename);
};

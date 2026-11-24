const fs = require('node:fs');
const path = require('node:path');
const ts = require('../../app/node_modules/typescript');
const app = path.resolve(__dirname, '../../app');
const modules = new Map();
function bundle(file) {
  if (modules.has(file)) return file;
  modules.set(file, '');
  if (file.endsWith('.json')) {
    modules.set(file, 'module.exports = ' + fs.readFileSync(file, 'utf8') + ';');
    return file;
  }
  let code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, esModuleInterop: true },
  }).outputText;
  code = code.replace(/require\(["']([^"']+)["']\)/g, (_match, request) => {
    const base = request.startsWith('@/') ? path.join(app, 'src', request.slice(2)) : path.resolve(path.dirname(file), request);
    const dependency = [base, base + '.ts', base + '.json'].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!dependency) throw new Error('Cannot bundle ' + request);
    return 'require(' + JSON.stringify(bundle(dependency)) + ')';
  });
  modules.set(file, code);
  return file;
}
const entry = bundle(path.join(app, 'src/lib/results/export-html-report.ts'));
const moduleCode = [...modules].map(([file, code]) => JSON.stringify(file) + ': function(module, exports, require) {\n' + code + '\n}').join(',\n');
const result = '(function(){const modules={' + moduleCode + '};const cache={};function require(id){if(!cache[id]){const module={exports:{}};cache[id]=module;modules[id](module,module.exports,require);}return cache[id].exports;}window.whispReport=require(' + JSON.stringify(entry) + ');})();';
fs.writeFileSync(path.join(process.argv[2], 'report.js'), result);
const labels = require('../../app/messages/pt-BR.json').Results;
const html = `<!doctype html><html><meta charset="utf-8"><body>
<button id="remote">Remote report</button><button id="local">Local report</button>
<button id="expired">Expired report</button><button id="slow">Slow report</button>
<output id="status"></output><script src="/report.js"></script><script>
const labels=${JSON.stringify(labels).replace(/</g, '\\u003c')};
const label=(key,values={})=>{let value=key.split('.').reduce((value,part)=>value[part],labels);for(const [key,item] of Object.entries(values))value=value.replace('{'+key+'}',item);return value;};
const fixture={language:'pt-BR',theme:'dark',title:'Local report',label,rows:[{plotId:'1',risk_pcrop:'low'}],columns:[{key:'plotId',header:'Plot ID'}]};
for(const id of ['remote','local','expired','slow'])document.getElementById(id).onclick=async()=>{
 const button=document.getElementById(id);button.disabled=true;document.getElementById('status').textContent='busy';
 try{await whispReport.exportHtmlReport({...fixture,local:id==='local',token:id==='remote'?'fixture':id,apiUrl:'http://localhost:8001/api',timeoutMs:id==='slow'?20:60000});document.getElementById('status').textContent='done';}
 catch(error){document.getElementById('status').textContent=error.reason;}
 finally{button.disabled=false;}
};
</script></body></html>`;
fs.writeFileSync(path.join(process.argv[2], 'index.html'), html);

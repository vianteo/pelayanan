import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>{throw new Error(m)};
const config=JSON.parse(read('app.config.json'));
const manifest=JSON.parse(read('src/appsscript.json'));
if(config.schemaVersion!==1||config.projectType!=='webapp'||config.dataStore!=='sheets'||config.deploymentMode!=='versioned')fail('app.config.json tidak sesuai kontrak web app.');
if(!Array.isArray(config.requiredScriptProperties)||config.requiredScriptProperties.some(x=>!/^[A-Z][A-Z0-9_]*$/.test(x)))fail('Nama Script Property tidak valid.');
if(manifest.runtimeVersion!=='V8'||manifest.timeZone!=='Asia/Jakarta'||!Array.isArray(manifest.oauthScopes)||!manifest.oauthScopes.length)fail('Manifest harus memakai V8, zona waktu, dan OAuth scopes eksplisit.');
const gs=fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.gs'));
let all='';for(const file of gs){const code=read('src/'+file);new vm.Script(code,{filename:file});all+='\n'+code}
new vm.Script(read('src/Client.html'),{filename:'Client.html'});
if(!/function\s+doGet\s*\(/.test(all))fail('Web app memerlukan doGet.');
if(/\beval\s*\(|new\s+Function\s*\(/.test(all))fail('eval/new Function dilarang.');
const dc=JSON.parse(read('.devcontainer/devcontainer.json'));
if(!dc.features?.['ghcr.io/devcontainers/features/github-cli:1'])fail('Devcontainer harus menyediakan GitHub CLI.');
const setup=read('scripts/setup-apps-script.sh');
for(const marker of ['env -u GH_TOKEN -u GITHUB_TOKEN gh','actions/secrets/public-key','resume_file','node_modules/.bin/clasp','3.3.0'])if(!setup.includes(marker))fail('Bootstrap kehilangan kontrak: '+marker);
const pwaSetup=read('scripts/setup-pwa.sh');
for(const marker of ['node_modules/.bin/firebase','15.27.0','deploy --only hosting','EXPECTED_BRANCH=\'main\''])if(!pwaSetup.includes(marker))fail('Setup PWA kehilangan kontrak: '+marker);
if(read('public/config.js').includes('__GAS_WEB_APP_URL__'))fail('URL Apps Script PWA masih placeholder.');
const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=path.join(dir,e.name);e.isDirectory()?walk(p):files.push(p)}}walk(root);
const secretPatterns=[/AIza[0-9A-Za-z_-]{30,}/,/gh[pousr]_[0-9A-Za-z]{30,}/,/"refresh_token"\s*:/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/(?:password|token|api_key)\s*=\s*["'][^"']{12,}["']/i];
for(const file of files){const text=fs.readFileSync(file,'utf8');for(const p of secretPatterns)if(p.test(text))fail('Kemungkinan secret ditemukan di '+path.relative(root,file));}
console.log(`Validasi berhasil: ${gs.length} file Apps Script, manifest, PWA, bootstrap, dan secret scan.`);

import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('approved workflow states exist',()=>{const code=fs.readFileSync('src/SwapService.gs','utf8');for(const s of ['MENUNGGU_PENGGANTI','MENUNGGU_ADMIN','DISETUJUI','DITOLAK_PENGGANTI','DITOLAK_ADMIN'])assert.match(code,new RegExp(s))});
test('public view excludes email',()=>{const code=fs.readFileSync('src/ScheduleService.gs','utf8');const body=code.match(/function publicSchedule_\(x\) \{([\s\S]*?)\n\}/)?.[1]||'';assert.doesNotMatch(body,/emailPetugas\s*:/)});
test('PWA is installable',()=>{const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest'));assert.equal(manifest.display,'standalone');assert.ok(manifest.icons.length);assert.match(fs.readFileSync('public/sw.js','utf8'),/addEventListener\('fetch'/)});
test('admin identity is server-side',()=>{const auth=fs.readFileSync('src/Auth.gs','utf8');assert.match(auth,/getAdminEmail_\(\)/);assert.match(auth,/requireAdmin_/)});
test('client JavaScript is valid',async()=>{const vm=await import('node:vm');assert.doesNotThrow(()=>new vm.Script(fs.readFileSync('src/Client.html','utf8')))});
test('PWA points to production Apps Script',()=>{const config=fs.readFileSync('public/config.js','utf8');assert.match(config,/https:\/\/script\.google\.com\/macros\/s\/.+\/exec/);assert.doesNotMatch(config,/__GAS_WEB_APP_URL__/)});

import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const version=Number(process.env.APPS_SCRIPT_VERSION);if(!Number.isInteger(version)||version<=0)throw new Error('APPS_SCRIPT_VERSION harus bilangan positif.');
const root=path.resolve(import.meta.dirname,'..');const clasp=path.join(root,'node_modules','.bin','clasp');
const run=args=>{const r=spawnSync(clasp,args,{cwd:root,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout};
if(run(['--version']).trim()!=='3.3.0')throw new Error('Versi clasp harus 3.3.0.');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'app.config.json')));const parsed=JSON.parse(run(['list-deployments','--json']));const list=parsed.deployments||parsed||[];const d=list.find(x=>String(x.description||'').startsWith(cfg.managedDeploymentDescription));if(!d)throw new Error('Managed deployment tidak ditemukan.');
run(['update-deployment',d.deploymentId||d.id,'--versionNumber',String(version),'--description',`${cfg.managedDeploymentDescription} rollback-v${version}`]);console.log(`Rollback ke Apps Script version ${version} selesai.`);

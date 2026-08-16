import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');const clasp=path.join(root,'node_modules','.bin','clasp');
const run=(args,opts={})=>{const r=spawnSync(clasp,args,{cwd:root,encoding:'utf8',...opts});if(r.status!==0)throw new Error(r.stderr||r.stdout||`clasp ${args[0]} gagal`);return r.stdout};
if(!fs.existsSync(clasp))throw new Error('Binary clasp project-local tidak ditemukan.');
if(run(['--version']).trim()!=='3.3.0')throw new Error('Versi clasp harus 3.3.0.');
run(['push','--force'],{stdio:'inherit'});
const cfg=JSON.parse(fs.readFileSync(path.join(root,'app.config.json'),'utf8'));const marker=cfg.managedDeploymentDescription;
let list=[];try{const parsed=JSON.parse(run(['list-deployments','--json']));list=parsed.deployments||parsed||[]}catch{list=[]}
const existing=list.find(x=>String(x.description||'').startsWith(marker));const desc=`${marker} ${process.env.GITHUB_SHA||'local'}`;
if(existing){run(['update-deployment',existing.deploymentId||existing.id,'--description',desc],{stdio:'inherit'});console.log('Managed deployment updated.')}else{run(['create-deployment','--description',desc],{stdio:'inherit'});console.log('Managed deployment created.');}

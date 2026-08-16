for(const name of ['CLASPRC_JSON','CLASP_JSON']){if(!process.env[name]){console.error(`${name} belum dikonfigurasi.`);process.exitCode=1}else console.log(`${name}: available`)}

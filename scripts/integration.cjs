'use strict';
const {spawnSync}=require('node:child_process');
const result=spawnSync(process.execPath,['--require','./tests/offline.cjs','--test','tests/integration/local.cjs'],{stdio:'inherit'});
process.exit(result.status??1);

'use strict';
const fs = require('node:fs'), path = require('node:path');
const {config} = require('../lib/environment.cjs');
const root = path.resolve(__dirname,'..');
function build(env = process.env, requested) {
  const cfg = config(env, requested); // Validate before touching output.
  const output = path.join(root,'dist');
  fs.rmSync(output,{recursive:true,force:true}); fs.mkdirSync(output,{recursive:true});
  const excluded = new Set(['.git','node_modules','dist','dev','scripts','tests','supabase','companion-server','docs','api','lib']);
  for (const item of fs.readdirSync(root,{withFileTypes:true})) {
    if (item.name.startsWith('.') || excluded.has(item.name) || /\.(sql|md|json|toml)$/.test(item.name)) continue;
    fs.cpSync(path.join(root,item.name),path.join(output,item.name),{recursive:true});
  }
  const file = path.join(output,'data/platform-config.js');
  fs.writeFileSync(file, `globalThis.CHEMATLAS_BUILD_CONFIG=${JSON.stringify(cfg)};\n` + fs.readFileSync(file,'utf8'));
  for (const name of ['index.html','admin.html']) {
    let html = fs.readFileSync(path.join(output,name),'utf8');
    const connect = cfg.mode === 'production' ? "'self' https://"+new URL(cfg.supabaseUrl).host : cfg.mode === 'local' ? "'self' "+cfg.supabaseUrl : "'self'";
    html = html.replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="connect-src ${connect}; form-action 'self'; object-src 'none'; base-uri 'self'">`);
    if (cfg.mode !== 'production') html = html.replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow">');
    fs.writeFileSync(path.join(output,name),html);
  }
  // No source SQL, credentials, test accounts, or backend handlers are public assets.
  if (cfg.mode !== 'production') {
    const text = fs.readFileSync(file,'utf8').split('/* Safe source-checkout default.')[0];
    if (text.includes('supabase.co') || /sb_secret_|service_role/.test(text)) throw Error('Unsafe public build configuration.');
  }
  return {output,cfg};
}
if (require.main === module) { const {cfg} = build(); console.log(`Built ${cfg.mode} frontend.`); }
module.exports = {build};

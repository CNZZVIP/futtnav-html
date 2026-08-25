// 统一推送脚本：从 .tokens.json 读取各平台令牌，对 Gitee / GitHub / CNB 三端执行 push。
// 用法：node scripts/push-all.mjs [--no-sync-github]
// 说明：不修改 .git/config，令牌统一从本地令牌库 .tokens.json 读取（gitignore 保护）。
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const store = JSON.parse(readFileSync(join(ROOT, '.tokens.json'), 'utf8'));

const REMOTES = {
  origin: { url: 'https://gitee.com/hiqw/futtnav-html.git' },
  gh: {
    url: 'https://github.com/CNZZVIP/futtnav-html.git',
    token: store.github?.token,
    user: 'x-access-token',
  },
  cnb: {
    url: 'https://cnb.cool/futtcn/futtnav-html.git',
    token: store.cnb?.token,
    user: store.cnb?.username || 'cnb',
  },
};

function sh(args, cwd = ROOT) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) console.error(`  ✗ ${args[0]} failed:\n${r.stderr}`);
  return r;
}

for (const [name, cfg] of Object.entries(REMOTES)) {
  let authUrl = cfg.url;
  if (cfg.token) authUrl = cfg.url.replace('https://', `https://${cfg.user}:${cfg.token}@`);
  console.log(`== push ${name} ==`);
  const r = sh(['push', authUrl, 'main']);
  if (r.status === 0) console.log(`  ✓ ${name} main 已同步`);
}

if (!process.argv.includes('--no-sync-github')) {
  console.log('== sync .github（GitHub Actions）==');
  const r = spawnSync('node', [join(ROOT, 'scripts/sync-github.mjs')], { cwd: ROOT, encoding: 'utf8' });
  console.log(r.stdout?.split('\n').slice(-3).join('\n'));
}

/* ============================================================
   FuttNav · 镜像同步工具：把本地 main 全量同步到 GitHub main
   ------------------------------------------------------------
   用途：Gitee/CNB 为主仓库，GitHub 作为镜像 + Actions 构建源。
   用 Git Data API 直接写 GitHub（不依赖 push 权限的 remote），
   保持 GitHub Pages 配置不受影响；同步后自动触发 GitHub
   Actions 的 Docker 镜像构建 workflow。

   用法：
     node scripts/sync-github.mjs <ghp_token>
     或设置环境变量 GITHUB_TOKEN 后：node scripts/sync-github.mjs
   ============================================================ */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const token = process.argv[2] || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('用法：node scripts/sync-github.mjs <ghp_token>  或设置环境变量 GITHUB_TOKEN');
  process.exit(1);
}
const OWNER = 'CNZZVIP';
const REPO = 'futtnav-html';
const API = 'https://api.github.com';
const H = { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(url, method = 'GET', body) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, {
        method,
        headers: { ...H, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let j = null; try { j = JSON.parse(text); } catch { /* 忽略 */ }
      if (![200, 201, 204].includes(res.status)) {
        throw new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 200)}`);
      }
      return { status: res.status, j };
    } catch (e) {
      if (i === 3) throw e;
      await sleep(300 * (i + 1));
    }
  }
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const gitBuf = args => {
  const r = spawnSync('git', ['-C', ROOT, ...args]);
  if (r.status !== 0) throw new Error((r.stderr || 'git failed').toString());
  return r.stdout;
};

// 1. GitHub 当前 main 作为 parent（新仓库则为空）
let ghMain = null;
try { ghMain = (await call(`${API}/repos/${OWNER}/${REPO}/git/ref/heads/main`)).j?.object?.sha; } catch { /* 仓库可能为空 */ }
console.log(`gh main: ${ghMain ? ghMain.slice(0, 7) : 'none(新仓库)'}`);

// 2. 本地 HEAD 全量文件（ls-tree -z 防路径转义）
const ls = gitBuf(['ls-tree', '-r', '-z', 'HEAD']).toString('utf8').split('\0').filter(Boolean);
const HEAD_MSG = gitBuf(['log', '-1', '--format=%s%n%n%b', 'HEAD']).toString('utf8').trim();
console.log(`files: ${ls.length}`);

// 3. 上传 blob（GitHub blob SHA 由内容决定，与本地 git 对象一致）
const treeEntries = [];
let uploaded = 0;
for (const line of ls) {
  const m = line.match(/^(\d{6}) (blob|tree) ([0-9a-f]{40})\t(.*)$/s);
  if (!m || m[2] !== 'blob') continue;
  const [, mode, , , path] = m;
  const content = gitBuf(['cat-file', 'blob', m[3]]);
  const b = await call(`${API}/repos/${OWNER}/${REPO}/git/blobs`, 'POST', {
    content: content.toString('base64'), encoding: 'base64',
  });
  if (!b.j?.sha) throw new Error(`blob 无 sha: ${path}`);
  treeEntries.push({ path, mode, type: 'blob', sha: b.j.sha });
  uploaded++;
  await sleep(25);
}
console.log(`blobs uploaded: ${uploaded}`);

// 4. tree -> commit -> 更新 main 引用
const tree = await call(`${API}/repos/${OWNER}/${REPO}/git/trees`, 'POST', { tree: treeEntries });
const commit = await call(`${API}/repos/${OWNER}/${REPO}/git/commits`, 'POST', {
  message: HEAD_MSG, tree: tree.j.sha,
  parents: ghMain ? [ghMain] : [],
  author: { name: 'hiqw', email: 'hiqw@users.noreply.gitee.com' },
  committer: { name: 'hiqw', email: 'hiqw@users.noreply.gitee.com' },
});
if (ghMain) {
  await call(`${API}/repos/${OWNER}/${REPO}/git/refs/heads/main`, 'PATCH', { sha: commit.j.sha });
} else {
  await call(`${API}/repos/${OWNER}/${REPO}/git/refs`, 'POST', { ref: 'refs/heads/main', sha: commit.j.sha });
}
console.log(`DONE main -> ${commit.j.sha.slice(0, 7)}（GitHub Actions 将自动构建 Docker 镜像）`);

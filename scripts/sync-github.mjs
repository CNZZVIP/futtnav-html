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
import { readFileSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 令牌优先级：命令行参数 > 环境变量 > 统一令牌库 .tokens.json（GitHub 令牌统一管理，不再每次新创建）
function loadToken() {
  if (process.argv[2]) return process.argv[2];
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const store = JSON.parse(readFileSync(join(ROOT, '.tokens.json'), 'utf8'));
    if (store?.github?.token) {
      console.log(`令牌来源：.tokens.json（${store.github.name || 'github'}）`);
      return store.github.token;
    }
  } catch { /* 令牌库不存在时走报错 */ }
  return null;
}
const token = loadToken();
if (!token) {
  console.error('未找到令牌：请传参 <ghp_token>、设置 GITHUB_TOKEN，或把令牌写入 .tokens.json（见 .tokens.example.json）');
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
//    含 .github/workflows——本工具令牌要求带 workflow scope（统一令牌库 Ai-Pro 已具备），
//    push 到 main 后会自动触发 GitHub Actions 构建。
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

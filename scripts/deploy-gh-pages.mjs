/**
 * 构建并发布 GitHub Pages（gh-pages 分支）
 *
 * 依赖：
 *   - 环境变量 GITHUB_TOKEN（仓库 Contents 读写权限）
 *   - 仓库 OWNER/REPO 默认取 git remote 解析，也可用环境变量覆盖
 *
 * 用法：
 *   GITHUB_TOKEN=ghp_xxx node scripts/deploy-gh-pages.mjs
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("缺少环境变量 GITHUB_TOKEN");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const API = "https://api.github.com";
const H = { Authorization: `token ${token}`, Accept: "application/vnd.github+json" };

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(url, method = "GET", body) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, {
        method,
        headers: { ...H, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let j = null; try { j = JSON.parse(text); } catch {}
      if (![200, 201, 204].includes(res.status)) {
        throw new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 150)}`);
      }
      return { status: res.status, j };
    } catch (e) {
      if (i === 3) throw e;
      await sleep(300 * (i + 1));
    }
  }
}

// 解析仓库
let ownerRepo;
try {
  const remote = execSync(`git -C "${ROOT}" remote get-url origin`, { encoding: "utf8" }).trim();
  const m = remote.match(/(?:github\.com[:/])([^/]+)\/([^/.]+)/);
  ownerRepo = m ? `${m[1]}/${m[2]}` : null;
} catch {}
ownerRepo = ownerRepo || (process.env.GH_REPO) || null;
if (!ownerRepo) {
  console.error("无法解析 GitHub 仓库（请设置 GH_REPO=owner/repo）");
  process.exit(1);
}
const BRANCH = process.env.GH_PAGES_BRANCH || "gh-pages";

// 1. 构建
console.log(">> 构建 dist ...");
execSync(`node "${path.join(ROOT, "scripts", "build.mjs")}"`, { cwd: ROOT, stdio: "inherit" });

// 2. 递归列出 dist 文件
function walk(dir, base = "") {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (fs.statSync(full).isDirectory()) out.push(...walk(full, rel));
    else out.push(rel);
  }
  return out;
}
const files = walk(DIST);
console.log(`>> dist files: ${files.length}`);

// 3. blobs → tree → commit → ref
const treeEntries = [];
for (const rel of files) {
  const content = fs.readFileSync(path.join(DIST, rel));
  const b = await call(`${API}/repos/${ownerRepo}/git/blobs`, "POST", { content: content.toString("base64"), encoding: "base64" });
  treeEntries.push({ path: rel, mode: "100644", type: "blob", sha: b.j.sha });
  await sleep(60);
}
const tree = await call(`${API}/repos/${ownerRepo}/git/trees`, "POST", { tree: treeEntries });

let parentSha = null;
try {
  const ref = await call(`${API}/repos/${ownerRepo}/git/ref/heads/${BRANCH}`, "GET");
  if (ref.status === 200) parentSha = ref.j?.object?.sha;
} catch {}
console.log(`>> ${BRANCH} parent: ${parentSha?.slice(0, 7) ?? "none(孤儿)"}`);

const commit = await call(`${API}/repos/${ownerRepo}/git/commits`, "POST", {
  message: `deploy: GitHub Pages ${new Date().toISOString().slice(0, 10)}`,
  tree: tree.j.sha,
  parents: parentSha ? [parentSha] : [],
  author: { name: "deploy-bot", email: "deploy-bot@users.noreply.github.com" },
  committer: { name: "deploy-bot", email: "deploy-bot@users.noreply.github.com" },
});
console.log(`>> commit: ${commit.j.sha.slice(0, 7)}`);

if (parentSha) {
  await call(`${API}/repos/${ownerRepo}/git/refs/heads/${BRANCH}`, "PATCH", { sha: commit.j.sha, force: true });
} else {
  await call(`${API}/repos/${ownerRepo}/git/refs`, "POST", { ref: `refs/heads/${BRANCH}`, sha: commit.j.sha });
}

// 4. 确保 Pages 源指向 gh-pages 分支
await call(`${API}/repos/${ownerRepo}/pages`, "PUT", { build_type: "legacy", source: { branch: BRANCH, path: "/" } });
console.log(">> 已发布: https://" + ownerRepo.split("/")[0] + ".github.io/" + ownerRepo.split("/")[1] + "/");

/**
 * 打包飞牛 fnOS 应用中心安装包（.fpk）
 *
 * 用法：
 *   node scripts/package-fpk.mjs [version]
 *
 * 产物：
 *   packaging/futtnav-<version>.fpk
 *
 * .fpk 本质是 tar.gz，内含：
 *   manifest / ICON.PNG / ICON_256.PNG / FuttNav.sc / health.json
 *   cmd/  config/  ui/  app.tgz（www 静态站点 + docker compose）
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const PKG_DIR = path.join(ROOT, "packaging", "fnos-app", "futtnav");
const VERSION = process.argv[2] || "1.0.0";
const STAGE = path.join(os.tmpdir(), `futtnav-fpk-${Date.now()}`);
const OUT_DIR = path.join(ROOT, "packaging");
const FPK = path.join(OUT_DIR, `futtnav-${VERSION}.fpk`);

function sh(cmd, cwd) {
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
}
function rm(p) { fs.rmSync(p, { recursive: true, force: true }); }

// 1. 确保已构建 dist
if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.log(">> 构建 dist ...");
  sh("node scripts/build.mjs", ROOT);
} else {
  console.log(">> 使用已有 dist 构建产物");
}

rm(STAGE);
fs.mkdirSync(path.join(STAGE, "app"), { recursive: true });

// 2. 生成 app.tgz（www 静态站点 + docker compose）
console.log(">> 组装 app.tgz ...");
fs.cpSync(DIST, path.join(STAGE, "app", "www"), { recursive: true });
fs.cpSync(path.join(PKG_DIR, "docker"), path.join(STAGE, "app", "docker"), { recursive: true });
sh(`tar -czf app.tgz -C app .`, STAGE);
rm(path.join(STAGE, "app")); // 只保留 app.tgz，不打包源目录

// 3. manifest 写入 app.tgz 的 md5 校验和
const md5 = crypto.createHash("md5").update(fs.readFileSync(path.join(STAGE, "app.tgz"))).digest("hex");
let manifest = fs.readFileSync(path.join(PKG_DIR, "manifest"), "utf8");
manifest = manifest.replace(/^checksum\s*=.*$/m, `checksum        = ${md5}`);
fs.writeFileSync(path.join(STAGE, "manifest"), manifest);

// 4. 复制其余打包文件
fs.cpSync(path.join(PKG_DIR, "cmd"), path.join(STAGE, "cmd"), { recursive: true });
fs.cpSync(path.join(PKG_DIR, "config"), path.join(STAGE, "config"), { recursive: true });
fs.cpSync(path.join(PKG_DIR, "ui"), path.join(STAGE, "ui"), { recursive: true });
fs.copyFileSync(path.join(PKG_DIR, "ICON.PNG"), path.join(STAGE, "ICON.PNG"));
fs.copyFileSync(path.join(PKG_DIR, "ICON_256.PNG"), path.join(STAGE, "ICON_256.PNG"));
fs.copyFileSync(path.join(PKG_DIR, "FuttNav.sc"), path.join(STAGE, "FuttNav.sc"));
fs.copyFileSync(path.join(PKG_DIR, "health.json"), path.join(STAGE, "health.json"));

// 5. 打包 .fpk
console.log(">> 打包 .fpk ...");
rm(FPK);
sh(`tar -czf "${FPK}" -C "${STAGE}" .`, STAGE);
rm(STAGE);
console.log(`>> 完成: ${FPK} (${fs.statSync(FPK).size} bytes)`);

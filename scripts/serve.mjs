/* ============================================================
   福天天导航 · 开源演示版 — 本地预览服务器（零依赖）
   用法：node scripts/serve.mjs [端口]（默认 4173）
   访问：http://localhost:4173/
   ============================================================ */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.argv[2]) || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  let filePath = normalize(join(ROOT, urlPath));
  // 防止路径穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // .html 后缀省略支持（/about -> about.html）
  if (!existsSync(filePath) && extname(filePath) === '' && existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const content = readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log('========================================');
  console.log(' 福天天导航 · 本地预览');
  console.log(' 地址：http://localhost:' + PORT + '/');
  console.log(' 按 Ctrl+C 停止');
  console.log('========================================');
});

/* ============================================================
   福天天导航 · 开源演示版 — 构建脚本
   ------------------------------------------------------------
   功能：
   1. 读取 src/partials/ 公共头尾模板
   2. 读取 src/pages/ 各页面中部内容 + 页面元数据（标题/描述/关键词/导航高亮）
   3. 拼接生成完整静态 HTML 到 dist/
   4. 复制 assets/ 与 public/
   5. 生成 robots.txt 与 sitemap.xml

   用法：node scripts/build.mjs
   环境变量 SITE_URL 可覆盖 src/site.config.json 中的 siteUrl（EdgeOne 构建时注入）
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const PARTIALS = join(SRC, 'partials');
const PAGES = join(SRC, 'pages');
const ASSETS = join(ROOT, 'assets');
const PUBLIC = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');

// ---------- 读取站点配置 ----------
const siteConfig = JSON.parse(readFileSync(join(SRC, 'site.config.json'), 'utf8'));
// EdgeOne 构建环境变量优先
if (process.env.SITE_URL) siteConfig.siteUrl = process.env.SITE_URL;

// ---------- 读取公共模板 ----------
const partials = {
  head: readFileSync(join(PARTIALS, 'head.html'), 'utf8'),
  header: readFileSync(join(PARTIALS, 'header.html'), 'utf8'),
  footer: readFileSync(join(PARTIALS, 'footer.html'), 'utf8')
};

// ---------- 工具函数 ----------
function parseMeta(source) {
  const meta = {};
  const m = source.match(/^\s*<!--([\s\S]*?)-->/);
  if (m) {
    m[1].split('\n').forEach(line => {
      const kv = line.match(/^\s*@(\w+)\s+(.+?)\s*$/);
      if (kv) meta[kv[1]] = kv[2].trim();
    });
  }
  return meta;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildJsonLd(page, meta, canonical) {
  const base = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.siteName,
    url: canonical,
    description: meta.desc
  };
  if (page === 'index') {
    base.potentialAction = {
      '@type': 'SearchAction',
      target: 'https://www.baidu.com/s?wd={search_term_string}',
      'query-input': 'required name=search_term_string'
    };
  } else {
    base['@type'] = 'WebPage';
  }
  return JSON.stringify(base, null, 2);
}

function buildCanonical(file) {
  if (!siteConfig.siteUrl) return file === 'index.html' ? 'index.html' : file;
  return file === 'index.html' ? `${siteConfig.siteUrl}/` : `${siteConfig.siteUrl}/${file}`;
}

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  cpSync(src, dest, { recursive: true });
}

// ---------- 主流程 ----------
console.log('========================================');
console.log(' 福天天导航 · 开源演示版 — 构建开始');
console.log('========================================');

// 1. 清理并重建 dist/
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// 2. 复制静态资源
copyDir(ASSETS, join(DIST, 'assets'));
copyDir(PUBLIC, DIST);
console.log(' ✔ 静态资源已复制 (assets/, public/)');

// 3. 构建页面
const pageFiles = readdirSync(PAGES).filter(f => f.endsWith('.html')).sort();
const pages = [];

for (const file of pageFiles) {
  const source = readFileSync(join(PAGES, file), 'utf8');
  const meta = parseMeta(source);

  // 清理页面主体中的元数据注释
  let body = source.replace(/^\s*<!--[\s\S]*?-->\s*/, '').trim();

  // 拼接完整页面
  const pageName = basename(file, extname(file));
  const canonical = buildCanonical(file);
  const title = meta.title || siteConfig.siteName;
  const desc = meta.desc || siteConfig.siteSlogan;
  const keywords = meta.keywords || '';
  const nav = meta.nav || 'home';
  const jsonLd = buildJsonLd(pageName, meta, canonical);

  const head = partials.head
    .replace(/%%TITLE%%/g, escapeHtml(title))
    .replace(/%%DESC%%/g, escapeHtml(desc))
    .replace(/%%KEYWORDS%%/g, escapeHtml(keywords))
    .replace(/%%CANONICAL%%/g, escapeHtml(canonical))
    .replace(/%%THEME_COLOR%%/g, siteConfig.themeColor || '#4a8cff')
    .replace(/%%SITE_NAME%%/g, escapeHtml(siteConfig.siteName))
    .replace(/%%JSONLD%%/g, jsonLd);

  const header = partials.header.replace(
    /<a class="nav-link" data-nav="([^"]+)"/g,
    (m, n) => `<a class="nav-link${n === nav ? ' active' : ''}" data-nav="${n}"`
  );

  const footer = partials.footer
    .replace(/%%COPYRIGHT%%/g, siteConfig.copyright || '')
    .replace(/%%ICP%%/g, siteConfig.icp || '');

  const html = [
    '<!DOCTYPE html>',
    '<html lang="' + (siteConfig.lang || 'zh-CN') + '">',
    '<head>',
    head,
    '</head>',
    '<body>',
    header,
    body,
    footer,
    '</body>',
    '</html>',
    ''
  ].join('\n');

  writeFileSync(join(DIST, file), html, 'utf8');
  pages.push({ file, canonical, title });
  console.log(` ✔ 生成 ${file}  (${title})`);
}

// 4. 生成 robots.txt
let robots = ['User-agent: *', 'Allow: /'];
if (siteConfig.siteUrl) {
  robots.push('', `Sitemap: ${siteConfig.siteUrl}/sitemap.xml`);
} else {
  robots.push('', '# 提示：配置 SITE_URL 环境变量后会自动生成完整 Sitemap 地址');
}
writeFileSync(join(DIST, 'robots.txt'), robots.join('\n') + '\n', 'utf8');
console.log(' ✔ 生成 robots.txt');

// 5. 生成 sitemap.xml
if (siteConfig.siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.map(p => {
    const loc = p.file === 'index.html' ? `${siteConfig.siteUrl}/` : `${siteConfig.siteUrl}/${p.file}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${p.file === 'index.html' ? '1.0' : '0.8'}</priority>\n  </url>`;
  }).join('\n');
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    ''
  ].join('\n');
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8');
  console.log(' ✔ 生成 sitemap.xml');
} else {
  console.log(' ⚠ 未配置 siteUrl，跳过 sitemap.xml（部署时通过环境变量 SITE_URL 配置）');
}

console.log('========================================');
console.log(' 构建完成 → ' + DIST);
console.log(' 页面：' + pages.length + ' 个');
if (siteConfig.siteUrl) console.log(' 站点：' + siteConfig.siteUrl);
console.log('========================================');

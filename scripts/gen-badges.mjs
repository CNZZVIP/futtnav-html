/* 生成 shields.io 风格 SVG 徽章到 public/badges/（与 hao.futt.cn 正式版同款样式） */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "badges");
mkdirSync(OUT, { recursive: true });

// 每个徽章：文件名, 左侧标签, 右侧值, 左侧色, 右侧色, aria, title(评级说明)
const badges = [
  ["gitee", "Gitee", "开源", "#c71d23", "#8a1616", "开源代码：MIT", "开源项目：Gitee 仓库（MIT License）"],
  ["github", "GitHub", "开源", "#24292e", "#57606a", "GitHub 开源", "开源项目：GitHub 仓库（MIT License）"],
  ["cnb", "CNB", "开源", "#0d47a1", "#1565c0", "CNB 开源", "开源项目：CNB 云原生构建仓库（MIT License）"],
  ["valid-html5", "W3C", "HTML5", "#005a9c", "#003366", "W3C HTML5: Valid", "W3C HTML5 标准校验：0 错误 0 警告"],
  ["valid-css", "W3C", "CSS3", "#005a9c", "#003366", "W3C CSS3: Valid", "W3C CSS 标准校验：通过"],
  ["ssl-a", "SSL TLS", "A", "#555", "#4c1", "SSL TLS: A", "SSL Labs TLS 配置评级：A"],
  ["security-headers", "Security Headers", "A", "#555", "#4c1", "Security Headers: A", "Security Headers 安全响应头评级：A"],
  ["hsts-preload", "HSTS", "PRELOAD", "#555", "#4c1", "HSTS: PRELOAD", "HSTS 强制 HTTPS：preload 指令已启用"],
  ["rich-results", "Rich", "Results", "#1a73e8", "#0f9d58", "Google Rich Results Test", "Google Rich Results Test：WebSite JSON-LD 结构化数据"],
  ["pagespeed-cwv", "PageSpeed", "CWV", "#555", "#34a853", "PageSpeed Core Web Vitals", "PageSpeed Insights：Core Web Vitals 性能实测"],
];

// 字符宽度估算（11px Verdana）：拉丁字符约 7px，中文字符约 11px，左右留白各 6px
function textWidth(s) {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 127 ? 11 : 7;
  return w;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

for (const [name, label, value, c1, c2, aria, title] of badges) {
  const labelW = Math.ceil(textWidth(label) + 12);
  const valueW = Math.ceil(textWidth(value) + 12);
  const totalW = labelW + valueW;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" viewBox="0 0 ${totalW} 20" role="img" aria-label="${escapeXml(aria)}">
  <title>${escapeXml(title)}</title>
  <clipPath id="c"><rect width="${totalW}" height="20" rx="3"/></clipPath>
  <g clip-path="url(#c)">
    <rect width="${labelW}" height="20" fill="${c1}"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${c2}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${Math.floor(labelW / 2)}" y="14">${escapeXml(label)}</text>
    <text x="${labelW + Math.floor(valueW / 2)}" y="14">${escapeXml(value)}</text>
  </g>
</svg>
`;
  writeFileSync(join(OUT, `${name}.svg`), svg, "utf8");
  console.log(` ✔ badges/${name}.svg  (${totalW}x20)`);
}
console.log(`共生成 ${badges.length} 个徽章 → public/badges/`);

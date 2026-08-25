# 福天天导航 · 开源演示版

> 安全 · 实用 · 高效 的网址导航 —— 纯 HTML / CSS / JavaScript 实现，无后台、零依赖，开箱即用。

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**项目仓库**：<https://gitee.com/hiqw/futtnav-html>

## 📖 项目简介

福天天导航开源演示版是 [福天天导航](https://hao.futt.cn) 的**完全静态开源版本**。整个站点由原生 HTML / CSS / JavaScript 编写，不依赖任何框架、打包器或后端服务；构建产物是纯静态文件，部署到任意静态托管平台即可运行，甚至可直接双击 `dist/index.html` 本地打开。

- **适合谁**：个人浏览器起始页 · 团队内部导航页 · 站长快速搭建导航站 · 前端学习者参考项目
- **与正式版的关系**：本项目是正式版的「精简演示」，不含在线后台管理、AI 智能助手等动态能力；演示站所有广告位统一为正式版引流
- **为什么开源**：提供一个结构清晰、可自由定制、零部署成本、SEO 友好的导航站实现，供社区复用与改进

> **在线演示**（本项目）：→ [nav.futt.cn](https://nav.futt.cn)
>
> **正式版**：功能完整（收录 2000+ 精选网站 · 在线后台管理 · AI 智能助手）→ [hao.futt.cn](https://hao.futt.cn)

---

## ✨ 特性

- **纯静态，零依赖** —— 原生 HTML / CSS / JavaScript，无框架、无构建工具，构建产物可直接双击打开
- **模板化构建** —— 公共头尾抽离为模板片段（`src/partials/`），全站共用，改一处生效
- **多引擎搜索** —— 内置百度 / 必应 / 360 / 谷歌，一键切换，移动端适配，引擎选择自动记忆
- **精选推荐 + 12 大分类** —— 人工筛选数百个优质站点，分类结构清晰
- **深色 / 浅色主题** —— 跟随系统、手动切换、偏好记忆
- **工具栏** —— 天气、分类速达、复制链接、返回顶部
- **SEO 友好** —— 每页独立 meta / Open Graph / Twitter Card / JSON-LD 结构化数据，构建自动生成 robots.txt 与 sitemap.xml
- **吸顶头部 + 站内联想** —— 头部含搜索框整条吸顶固定，输入关键词自动联想本站收录站点
- **一键部署** —— 内置 EdgeOne Makers 配置，推送到 Git 仓库即自动构建上线；产物兼容 Vercel / Netlify / 任意静态托管

## 📁 目录结构

```
├── edgeone.json           # EdgeOne Makers 一键部署配置（构建命令 / 输出目录 / Node 版本）
├── package.json           # npm 脚本（build / preview），零依赖
├── LICENSE                # MIT 开源协议
├── CONTRIBUTING.md        # 贡献指南
├── src/
│   ├── site.config.json   # 站点配置（站点名、正式版地址、版权、主题色等）
│   ├── partials/          # 公共模板（head / header / footer，全站共用）
│   └── pages/             # 各页面中部内容 + 页面元数据（@title @desc @keywords @nav）
├── assets/
│   ├── css/style.css      # 全站统一样式（顶部 CSS 变量可整体换肤）
│   └── js/
│       ├── config.js      # 展示结构配置（精选 Tab / 侧边栏分类 / 搜索引擎）
│       ├── data.js        # 网站数据（精选推荐 + 全部分类 + 友情链接）
│       └── app.js         # 主逻辑（搜索 / 渲染 / 主题 / 工具栏 / 引流参数）
├── public/                # 原样复制的静态资源（favicon、symbol 图标等）
├── scripts/
│   ├── build.mjs          # 构建脚本（模板拼接 + robots.txt + sitemap.xml）
│   └── serve.mjs          # 本地预览服务器（零依赖，Node ≥ 18）
└── dist/                  # 构建产物（部署目录，不入库）
```

## 🚀 快速开始

### 本地预览

```bash
npm install        # 零依赖，仅为统一入口，可跳过
npm run build      # 生成 dist/
npm run preview    # 或 node scripts/serve.mjs，访问 http://localhost:4173/
```

> 也可以直接打开 `dist/index.html`（双击即可，无任何服务器依赖）。

### 修改站点内容

| 想改什么 | 改哪里 |
|---|---|
| 站点名称 / 版权 / 正式版地址 / 主题色 | `src/site.config.json` |
| 新增或删除网站 | `assets/js/data.js` |
| 精选推荐 Tab / 侧边栏分类 | `assets/js/config.js` |
| 顶部导航 / 页脚 / 工具栏 | `src/partials/header.html`、`footer.html` |
| 页面标题 / 描述 / 关键词 | 对应 `src/pages/*.html` 顶部的 `@title @desc @keywords` |
| 全站配色 / 样式 | `assets/css/style.css` 顶部 CSS 变量 |

## 🧩 二次开发指南

### 1. `src/site.config.json` —— 站点级配置

| 字段 | 说明 |
|---|---|
| `siteName` | 站点名称，用于页面标题、Logo 文字 |
| `siteSlogan` | 站点标语，显示在头部副标题 |
| `siteUrl` | 站点正式域名（如 `https://nav.futt.cn`），用于 canonical 与 sitemap.xml |
| `officialUrl` | 正式版地址，头部「访问正式版」按钮与页脚 CTA 的引流目标 |
| `copyright` | 页脚版权声明 |
| `icp` | ICP 备案号（预留字段，当前模板未渲染；如需展示请在 `footer.html` 中自行输出） |
| `lang` | 页面语言，写入 `<html lang>` 与 meta |
| `themeColor` | 浏览器主题色（地址栏颜色） |

### 2. `assets/js/data.js` —— 网站数据

全站收录的站点链接都在此维护，按分组命名约定：

- `TJ_a ~ TJ_g`：首页「精选推荐」Tab 的数据，键名与 `config.js` 的 `navTabs` 对应
- `FL_a ~ FL_l`：首页「全部分类」区块的数据，与 `config.js` 的 `sidebar` 及 `index.html` 的 `<section id="FL_x">` 锚点对应
- `YL_a`：底部「友情链接」

每个站点对象的字段：

```js
{ name: "站点名称", url: "https://example.com" }        // 最简写法
{ name: "重点站点", url: "https://example.com", highlight: true }  // 置顶高亮（金色描边）
{ name: "特殊站点", url: "https://example.com", icon: "custom-icon" } // 覆盖默认 favicon 图标
```

- `name`：必填，卡片显示文字
- `url`：必填，跳转地址
- `highlight`：可选，置顶高亮强调
- `icon`：可选，自定义图标名（对应 `public/symbol/` 中 `icon-xxx`）；不填则自动从域名推导 favicon

### 3. `assets/js/config.js` —— 展示结构配置

- `NAV_CONFIG.navTabs`：精选推荐上方的 Tab 页签。新增 Tab = 在 `data.js` 加 `TJ_x` 数组 + 此处加一项
- `NAV_CONFIG.sidebar`：左侧「网站分类」速达菜单（含工具栏分类面板）。新增分类需同步修改 `index.html`（增加 `<section id="FL_x">`）
- `SEARCH_ENGINES`：搜索框引擎切换。新增引擎需在 `index.html` 桌面端与移动端搜索区各加一个选项节点

### 4. 模板机制（`src/partials/` + `src/pages/`）

`scripts/build.mjs` 会把三个公共模板片段与各页面中部内容拼接为完整 HTML：

| 模板 | 作用 |
|---|---|
| `partials/head.html` | `<head>`：meta / OG / JSON-LD / 资源引用，模板变量 `%%SITE%%`、`%%TITLE%%`、`%%DESC%%`、`%%KEYWORDS%%`、`%%NAV%%`、`%%JSONLD%%`、`%%CANONICAL%%` |
| `partials/header.html` | 全站统一头部（Logo / 搜索区 / 导航 / 引流按钮） |
| `partials/footer.html` | 全站统一页脚（版权 / 链接 / CTA），模板变量 `%%COPYRIGHT%%`、`%%VERSION%%` |

页面文件顶部通过 `@` 注释声明元数据：

```html
<!--
  @title 页面标题
  @desc 页面描述（150 字以内）
  @keywords 关键词, 用逗号分隔
  @nav 是否需要头部导航搜索区（1 需要 / 0 仅 Logo 与引流按钮）
  @jsonld <script type="application/ld+json">…</script>（可选，覆盖默认结构化数据）
-->
```

### 5. 样式定制（`assets/css/style.css`）

文件顶部定义了全套 CSS 变量（主色、背景、卡片圆角、阴影等），改变量即可整体换肤，无需深入其他样式。

## 🧭 广告位说明

本项目是演示站，**广告位均为正式版引流**，不包含任何第三方广告（无 Google AdSense / 联盟广告）。

顶部横幅、中部卡片、正文穿插条、底部大横幅、页脚 CTA，全部为**正式版引流**，统一指向 <https://hao.futt.cn>：

- 文案直接写在 `src/pages/index.html` 与 `src/partials/footer.html` 中，改文案即改 HTML
- 广告链接为静态外链，利于搜索引擎收录与引流
- fork 后用于自己的站点时，替换这些链接与文案即可

## ☁️ 一键部署（EdgeOne Makers）

本项目内置 `edgeone.json`，推送到 Git 仓库即可自动构建上线。

### 方式一：Git 导入（推荐）

1. 将本仓库推送到你的 Git 平台（Gitee / GitHub 等）
2. 打开 [EdgeOne Makers 控制台](https://console.cloud.tencent.com/edgeone) → 新建项目 → 选择「导入 Git 仓库」
3. 部署分支选择 `main`，项目已自动读取 `edgeone.json`：
   - 构建命令：`node scripts/build.mjs`
   - 输出目录：`dist`
4. 在项目的「环境变量」中配置：
   - `SITE_URL`：你的演示站域名（如 `https://nav.futt.cn`），用于生成 canonical、sitemap.xml
5. 绑定自定义域名，访问即上线；之后每次 `git push` 自动重新构建部署

### 方式二：CLI 手动部署

```bash
edgeone makers deploy --area global
```

### 其他平台

因为产物是纯静态文件（`dist/`），同样支持：

- **Vercel**：Framework Preset 选 Other，Build Command `node scripts/build.mjs`，Output Directory `dist`
- **Netlify**：Build Command `node scripts/build.mjs`，Publish Directory `dist`
- **GitHub Pages / Cloudflare Pages**：发布 `dist/` 目录
- **任意 Nginx / 对象存储静态托管**：上传 `dist/` 即可

## 🔍 SEO 说明

- 每页独立 `title / description / keywords / canonical / Open Graph / Twitter Card`
- 首页注入 `WebSite + SearchAction` 结构化数据，内页注入 `WebPage`
- 构建时自动生成：
  - `robots.txt`（含 Sitemap 地址）
  - `sitemap.xml`（需配置 `SITE_URL` 后自动生成）
- 所有站外链接自动追加 `?source=hao.futt.cn` 参数，便于统计引流来源（逻辑见 `app.js` ContentRenderer）

## ❓ FAQ

**Q：为什么我改了 `data.js` 页面没变化？**
构建是模板拼接 + 静态资源复制，修改后需重新执行 `npm run build` 再刷新。

**Q：新增一个分类需要改几处？**
三处：① `data.js` 新增 `FL_x` 数组；② `config.js` sidebar 加一项；③ `index.html` 增加 `<section class="category" id="FL_x">`。精选 Tab 同理，但只需前两处。

**Q：搜索框能换搜索引擎吗？**
可以。`config.js` 的 `SEARCH_ENGINES` 定义引擎，桌面端与移动端搜索区的下拉节点需与 `data-engine` 对应。

**Q：部署后 `canonical` 为什么是当前地址？**
未配置 `SITE_URL` 时 canonical 会取当前页面地址；配置后构建会生成固定域名版本并输出 sitemap.xml。

**Q：可以直接去掉「正式版」引流链接吗？**
可以。所有引流点（`officialUrl` 配置、`index.html` 广告位、`footer.html` CTA）改为自己的地址或删除即可。

**Q：Node 版本有要求吗？**
构建脚本使用原生 `fs` 模块，Node ≥ 18 即可；本地预览同样无需第三方依赖。

## 🤝 贡献

欢迎提交 Issue 与 Pull Request，贡献前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源，可自由使用、修改、商用。请保留版权声明。

收录的网站均为公开互联网资源，版权归各自站点所有；本站仅做导航收录。

---

**福天天导航 · 正式版**：[https://hao.futt.cn](https://hao.futt.cn)

## 🏅 项目质量

### 仓库

[![Gitee stars](https://gitee.com/hiqw/futtnav-html/badge/star.svg?theme=white)](https://gitee.com/hiqw/futtnav-html)
[![Gitee forks](https://gitee.com/hiqw/futtnav-html/badge/fork.svg?theme=white)](https://gitee.com/hiqw/futtnav-html)
[![License: MIT](https://img.shields.io/badge/License-MIT-1B9E55?style=for-the-badge)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/zh-CN/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/zh-CN/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
[![EdgeOne](https://img.shields.io/badge/EdgeOne-Makers-006EFF?style=for-the-badge&logo=tencentqq&logoColor=white)](https://console.cloud.tencent.com/edgeone)

### 在线验证（[nav.futt.cn](https://nav.futt.cn)）

[![HTML5 Valid](https://img.shields.io/badge/W3C-HTML5-1572B6?style=for-the-badge&logo=html5&logoColor=white)](https://validator.w3.org/nu/?doc=nav.futt.cn)
[![CSS3 Valid](https://img.shields.io/badge/W3C-CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://jigsaw.w3.org/css-validator/validator?uri=nav.futt.cn)
[![SSL TLS A](https://img.shields.io/badge/SSL_TLS-A-00B86B?style=for-the-badge&logo=letsencrypt&logoColor=white)](https://www.ssllabs.com/ssltest/analyze.html?d=nav.futt.cn)
[![Security Headers A](https://img.shields.io/badge/Security_Headers-A-00B86B?style=for-the-badge&logo=securityscorecard&logoColor=white)](https://securityheaders.com/?q=nav.futt.cn)
[![HSTS Preload](https://img.shields.io/badge/HSTS-PRELOAD-00B86B?style=for-the-badge&logo=https&logoColor=white)](https://hstspreload.org/?domain=nav.futt.cn)
[![Rich Results](https://img.shields.io/badge/Rich-Results-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://search.google.com/test/rich-results?url=nav.futt.cn)
[![PageSpeed CWV](https://img.shields.io/badge/PageSpeed-CWV-00B86B?style=for-the-badge&logo=googlechrome&logoColor=white)](https://pagespeed.web.dev/analysis?url=nav.futt.cn)

### 协议 & 合规

- **协议**：MIT，可自由使用、修改、商用，需保留版权声明（`LICENSE`）
- **零依赖**：原生 HTML / CSS / JavaScript，无任何第三方运行时或构建依赖
- **无追踪**：页面无第三方统计脚本；站外链接统一追加 `?source=hao.futt.cn` 便于统计引流
- **安全默认**：所有外链使用 HTTPS；支持自定义 `SITE_URL` 生成 canonical / sitemap.xml

---

🐛 Bug 反馈 / ✨ 功能建议：[Gitee Issues](https://gitee.com/hiqw/futtnav-html/issues) · 📧 联系：5064895@qq.com

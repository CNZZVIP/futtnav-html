# 贡献指南

感谢你愿意为「福天天导航 · 开源版」贡献代码或想法！请花两分钟阅读以下约定。

## 开发环境

- Node.js ≥ 20（构建与本地预览）
- 无需安装任何依赖（项目零依赖）

```bash
node scripts/build.mjs   # 构建
node scripts/serve.mjs   # 本地预览 http://localhost:4173/
```

## 代码规范

- **HTML**：页面主体只写中部内容；公共头尾必须放 `src/partials/`，通过模板构建复用，禁止在各页面重复粘贴
- **CSS**：统一在 `assets/css/style.css` 维护；配色优先使用 `:root` 中的 CSS 变量；同时适配深色主题（`[data-theme=dark]`）
- **JS**：模块划分清晰，遵循现有 `class` 组织方式（`SearchManager` / `NavManager` 等）；不引入新依赖
- **数据**：新增网站写入 `assets/js/data.js`，格式与现有条目保持一致（`{ name, url, icon?, highlight? }`）
- **编码**：UTF-8，缩进 2 空格，行尾无多余空格

## 提交信息

使用语义化提交信息，例如：

- `feat: 新增 XX 分类`
- `fix: 修复 XX 图标不显示`
- `docs: 更新部署文档`
- `style: 调整页脚样式`

## 提交流程

1. Fork 本仓库，创建功能分支：`git checkout -b feat/xxx`
2. 完成修改后先构建验证：`node scripts/build.mjs`
3. 本地预览确认无误：`node scripts/serve.mjs`
4. 提交（遵循提交信息规范）并推送分支
5. 提交 Pull Request，描述修改内容与验证方式

## 注意事项

- 请勿提交包含个人隐私信息的内容（如统计代码 ID、私有 token 等）
- 新增外部链接请确认站点安全、内容健康
- 广告位默认用于正式版引流，如需变更请先说明用途

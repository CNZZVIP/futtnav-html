# FuttNav 多平台应用中心打包

FuttNav（福天天导航）是纯静态零依赖站点，可打包为多种 NAS / 应用中心格式，供其它用户一键安装部署。

## 一、飞牛 fnOS 应用中心（.fpk 安装包）

### 打包
```bash
node scripts/package-fpk.mjs [version]
# 默认 version=1.0.0，产物：packaging/futtnav-<version>.fpk
```

`.fpk` 本质是 `tar.gz`，内容如下：

| 文件/目录 | 说明 |
|---|---|
| `manifest` | 应用元数据（appname/version/desc/checksum 等） |
| `app.tgz` | 应用文件：`www/`（静态站点）+ `docker/docker-compose.yaml` |
| `cmd/main` | 生命周期脚本（start/stop/status，基于 docker 状态检查） |
| `cmd/service-setup` | 安装后把内置站点文件部署到数据目录 `@appdata/www` |
| `config/privilege` | 权限（`run-as: package` 非 root 运行） |
| `config/resource` | 端口 / 数据目录 / docker-project 声明 |
| `ui/config` + `ui/images/` | 桌面入口（`http://127.0.0.1:8080`） |
| `FuttNav.sc` | 端口协议声明（8080/tcp） |
| `health.json` | 健康检查（HTTP 200/30x 通过） |
| `ICON.PNG` / `ICON_256.PNG` | 应用图标（64/256） |

### 本地测试安装
1. 飞牛 fnOS 开启 Docker
2. 应用中心 → 右上角 **手动安装** → 选择 `futtnav-1.0.0.fpk`
3. 安装完成后从桌面打开「福天天导航」入口

> 容器使用 `nginxinc/nginx-unprivileged` 镜像，非 root 运行；站点文件只读挂载，卸载应用不影响数据目录。

### 提交到飞牛应用中心（供全网用户安装）
1. 前往飞牛应用开放平台 https://developer.fnnas.com 注册开发者账号
2. 按平台要求提交 `.fpk` 包与审核资料
3. 审核通过后即出现在 fnOS 应用中心，其它用户可一键安装

也可提交到第三方应用商店（如 conversun/fnos-apps，按该仓库规范附上本仓库 `packaging/fnos-app/futtnav/` 目录并提 PR）。

## 二、通用 Docker Compose（适配其它 NAS 平台）

`packaging/docker/` 提供了平台无关的 Docker Compose 编排，**支持所有带 Docker / Compose 的 NAS 与家庭服务器**：

- 飞牛 fnOS（手动 compose）
- 绿联 UGOS Pro / 极空间 / 群晖 DSM / 威联通 QNAP
- CasaOS / Unraid / TrueNAS Scale / OpenMediaVault
- 任意 Linux 主机（安装 Docker 后直接使用）

### 用法
```bash
cd packaging/docker
node ../../scripts/build.mjs        # 构建静态站点
# 将 dist/ 复制为 www/
node -e "require('fs').cpSync('../../dist','www',{recursive:true})"
docker compose up -d
# 访问 http://<NAS-IP>:8080
```

> 修改端口：编辑 `docker-compose.yaml` 中的 `"8080:8080"` 左侧数字即可。

## 三、GitHub Pages（自动发布）

```bash
# 需要 GitHub Token（仓库 Settings → Developer settings → Fine-grained/classic PAT）
# 授权仓库 Contents 读写权限
$env:GITHUB_TOKEN = "ghp_xxx"
node scripts/deploy-gh-pages.mjs
```

脚本自动构建 dist → 推送到 `gh-pages` 分支 → 站点生效。
线上地址：`https://<user>.github.io/futtnav-html/`

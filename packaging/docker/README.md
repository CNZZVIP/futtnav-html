# FuttNav · Docker 部署简介

**FuttNav（福天天导航）** 是一个开源网址导航 / 浏览器起始页，纯静态零依赖：自定义站点分组、置顶高亮、站点图标、多搜索引擎切换、深色/浅色主题，开箱即用。

本项目提供平台无关的 Docker 编排，**任何支持 Docker 的 NAS 或 Linux 主机**都能一键部署：

- 飞牛 fnOS / 群晖 DSM / 威联通 QNAP / 绿联 UGOS / 极空间
- CasaOS / Unraid / TrueNAS Scale / OpenMediaVault
- 普通 Linux / 云服务器（装好 Docker 即可）

## 镜像

两种镜像来源，任选其一：

| 来源 | 说明 |
|---|---|
| **官方镜像包**（推荐） | `ghcr.io/cnzzvip/futtnav:latest`，已内置构建好的站点，一条 `docker run` 即可运行，无需克隆仓库 |
| **源码本地构建** | 本目录的 `Dockerfile` + 多阶段构建，可自定义站点后再打包 |

镜像特点：
- 运行镜像：`nginxinc/nginx-unprivileged:1.27-alpine`（官方，非 root 运行，安全默认）
- 支持 `linux/amd64` 与 `linux/arm64`（x86 / 飞腾 / 鲲鹏 / M 系均可用）
- 内置健康检查，容器异常自动重启（`--restart unless-stopped`）

## 快速开始

### 方式一：官方镜像一键运行（推荐，无需克隆仓库）

```bash
docker run -d --name futtnav \
  -p 8080:8080 \
  --restart unless-stopped \
  ghcr.io/cnzzvip/futtnav:latest
# 访问 http://<NAS-IP>:8080
```

若已配置 Docker Hub 镜像：把 `ghcr.io/cnzzvip/futtnav` 换成 `<你的账号>/futtnav` 即可。

### 方式二：Docker Compose（源码部署）

```bash
cd packaging/docker
node ../../scripts/build.mjs        # 构建静态站点
node -e "require('fs').cpSync('../../dist','www',{recursive:true})"
docker compose up -d
# 访问 http://<NAS-IP>:8080
```

> 官方镜像内置的是默认站点；想改成自己的导航内容，把站点文件放到 `www/` 后挂载（见下文「自定义站点」）。

### 方式三：Docker CLI（源码部署）

```bash
docker run -d --name futtnav \
  -p 8080:8080 \
  -v "$PWD/www:/usr/share/nginx/html:ro" \
  --restart unless-stopped \
  nginxinc/nginx-unprivileged:1.27-alpine
```

### 方式四：NAS 应用中心

飞牛 fnOS 用户直接用应用中心的 `futtnav-1.0.0.fpk` 一键安装（见 `../README.md`），无需手动 compose。

## 常用操作

| 操作 | 命令 |
|---|---|
| 查看状态 | `docker compose ps` |
| 查看日志 | `docker compose logs -f` |
| 停止 | `docker compose down` |
| 升级（换新镜像） | `docker compose pull && docker compose up -d` |

## 修改端口

编辑 `docker-compose.yaml`，改 `ports` 左侧数字：

```yaml
ports:
  - "9000:8080"   # 改为 9000，访问 http://<NAS-IP>:9000
```

## 自定义站点

- **用官方镜像**：把改好的站点文件放进宿主 `www/` 目录，再挂载覆盖默认站点：

  ```bash
  docker run -d --name futtnav \
    -p 8080:8080 \
    -v "$PWD/www:/usr/share/nginx/html:ro" \
    --restart unless-stopped \
    ghcr.io/cnzzvip/futtnav:latest
  ```

- **源码方式**：`www/` 目录内的文件就是站点本体，直接编辑即可（改标题、加站点、换配色都在 `www/assets/js/` 下）。重新构建源码则运行 `node ../../scripts/build.mjs` 后复制 `dist/` 内容到 `www/`。

> 本项目所有静态页面均无后端依赖，Docker 容器只是"文件服务器"；站点数据全部保存在宿主 `www/` 目录，卸载容器不丢数据。

## 维护者：构建并推送镜像

源码推送 GitHub `main` 分支后，GitHub Actions 会自动构建多架构镜像并推送（`ghcr.io/cnzzvip/futtnav:latest`）。若需本地构建：

```bash
cd 仓库根目录
docker build -f packaging/docker/Dockerfile -t futtnav:local .
docker run -d --name futtnav -p 8080:8080 futtnav:local
```

推送到 Docker Hub：在 GitHub 仓库 Settings → Secrets and variables → Actions 配置
`DOCKER_HUB_USERNAME`（账号）与 `DOCKER_HUB_TOKEN`（Access Token），之后每次推送源码自动同步到 Docker Hub。

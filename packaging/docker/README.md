# FuttNav · Docker 部署简介

**FuttNav（福天天导航）** 是一个开源网址导航 / 浏览器起始页，纯静态零依赖：自定义站点分组、置顶高亮、站点图标、多搜索引擎切换、深色/浅色主题，开箱即用。

本项目提供平台无关的 Docker 编排，**任何支持 Docker 的 NAS 或 Linux 主机**都能一键部署：

- 飞牛 fnOS / 群晖 DSM / 威联通 QNAP / 绿联 UGOS / 极空间
- CasaOS / Unraid / TrueNAS Scale / OpenMediaVault
- 普通 Linux / 云服务器（装好 Docker 即可）

## 镜像

- 基础镜像：`nginxinc/nginx-unprivileged:1.27-alpine`（官方，非 root 运行，安全默认）
- 站点文件：只读挂载进容器，宿主改动即时生效
- 无需任何构建环境，站点文件已内置在 `www/` 目录

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
cd packaging/docker
docker compose up -d
# 访问 http://<NAS-IP>:8080
```

### 方式二：Docker CLI

```bash
docker run -d --name futtnav \
  -p 8080:8080 \
  -v "$PWD/www:/usr/share/nginx/html:ro" \
  --restart unless-stopped \
  nginxinc/nginx-unprivileged:1.27-alpine
```

### 方式三：NAS 应用中心

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

`www/` 目录内的文件就是站点本体，直接编辑即可（改标题、加站点、换配色都在 `www/assets/js/` 下）。重新构建源码则运行 `node ../../scripts/build.mjs` 后复制 `dist/` 内容到 `www/`。

> 本项目所有静态页面均无后端依赖，Docker 容器只是"文件服务器"；站点数据全部保存在宿主 `www/` 目录，卸载容器不丢数据。

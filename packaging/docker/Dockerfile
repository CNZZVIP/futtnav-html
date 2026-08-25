# ============================================================
#   FuttNav 福天天导航 · Docker 镜像
#   ------------------------------------------------------------
#   多阶段构建：Node 生成静态站 → nginx 非 root 运行
#   产物：单文件服务器镜像，支持 linux/amd64 与 linux/arm64
#   ============================================================

# ---------- 构建阶段 ----------
FROM node:22-alpine AS build
WORKDIR /app
# 构建脚本为零依赖纯 Node（.dockerignore 已排除 dist/.git 等）
COPY . .
RUN node scripts/build.mjs

# ---------- 运行阶段 ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine
# 静态产物拷贝到 nginx 默认站点目录
COPY --from=build /app/dist/ /usr/share/nginx/html/
# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
# nginx-unprivileged 监听 8080（非 80）
EXPOSE 8080

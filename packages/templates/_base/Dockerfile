# LynxKit 通用 Dockerfile
# 多阶段构建：依赖安装 -> 构建 -> 运行时（含 Caddy）
# 业务方接入后可根据模板需要调整

# ===== Stage 1: 依赖安装 =====
FROM node:20-alpine AS deps
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# 复制 lockfile 与 package.json（利用层缓存）
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma
COPY packages ./packages

# 安装依赖（包含 devDependencies，构建需要）
RUN pnpm install --frozen-lockfile

# ===== Stage 2: 构建 =====
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# 生成 Prisma Client
RUN pnpm --filter @lynxkit/api exec prisma generate || true

# 构建应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @lynxkit/web build

# 剔除 devDependencies
RUN pnpm prune --prod

# ===== Stage 3: 运行时 =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 安装 Caddy
RUN apk add --no-cache caddy

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY Caddyfile ./Caddyfile

EXPOSE 3000 80 443

# 启动 Next.js + Caddy（Caddy 监听 80/443，反向代理到 Next.js）
CMD ["sh", "-c", "node server.js & caddy run --config ./Caddyfile"]

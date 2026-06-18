# syntax=docker/dockerfile:1

############################
# 1. Dependências (com bun)
############################
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

############################
# 2. Build (também serve de "migrator": tem o Prisma CLI + schema engine)
############################
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# URL placeholder só para satisfazer env() em prisma.config.ts e a construção do
# client no build. Nenhuma conexão é feita aqui; em runtime o compose injeta a real.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
# Gera o Prisma Client (WASM query compiler + tipos) antes do build do Next.
RUN bunx prisma generate
RUN bun run build

############################
# 3. Runner (Node alpine enxuto)
############################
# Prisma 7 não usa engine nativo em runtime (query compiler é WASM; pg é JS puro),
# então o app não precisa do CLI/engine — alpine enxuto basta. As migrations
# rodam no serviço `migrate` do compose (estágio builder acima).
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuário sem privilégios
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Saída standalone do Next (já inclui o pg + deps traçadas e o client embutido).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

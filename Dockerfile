FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL="postgresql://hayat_user:hayat_password@postgres:5432/hayat_db?schema=public"
ENV DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl \
  && addgroup -S nodejs \
  && adduser -S nextjs -G nodejs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]

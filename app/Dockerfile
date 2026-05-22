FROM node:22-slim AS deps
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
ARG VERSION
ENV NEXT_PUBLIC_APP_VERSION=$VERSION
WORKDIR /app
COPY app ./
COPY docs /docs
COPY LICENSE /LICENSE
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]

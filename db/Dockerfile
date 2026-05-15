FROM node:22-slim
WORKDIR /app

COPY db/package.json db/package-lock.json ./
RUN npm ci --omit=dev

COPY db/migrate.js ./
COPY db/migrations/ ./migrations/
COPY db/migration-entrypoint.sh ./
RUN chmod +x migration-entrypoint.sh

ENTRYPOINT ["./migration-entrypoint.sh"]

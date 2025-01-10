# Use Python 3.11 as the base image
FROM python:3.11-slim AS base

# Install Node.js v20.9.0, and necessary libraries for numpy
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Verify Node.js and npm installations
RUN node -v && npm -v

# Install Python packages from requirements.txt
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY . .
COPY credentials.json /app
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build
# RUN npm run test

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create the temp directory here
RUN mkdir -p /app/temp

# Copy all necessary files from the builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/python /app/src/python
COPY --from=builder /app/credentials.json ./

EXPOSE 3000

CMD ["npm", "start"]

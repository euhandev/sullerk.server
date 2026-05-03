# --- Stage 1: Build ---
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json, lock file, and prisma schema first for caching
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install dependencies (ignoring scripts initially to avoid running prisma generate before schema is available)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the NestJS application
RUN pnpm run build

# --- Stage 2: Production ---
FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy necessary files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma Client for the production environment
RUN npx prisma generate

# Expose the application port
EXPOSE 5353

# Start the application
CMD ["pnpm", "run", "start:prod"]
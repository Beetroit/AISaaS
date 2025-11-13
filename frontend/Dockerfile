# Stage 1: Dependencies
FROM node:20-slim AS dependencies

WORKDIR /app/frontend

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-slim AS builder

WORKDIR /app/frontend

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Copy node_modules from the dependencies stage
COPY --from=dependencies /app/frontend/node_modules ./node_modules

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN pnpm run build

# Stage 3: Runner
FROM node:20-slim AS runner

WORKDIR /app/frontend

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Copy only necessary build output from the builder stage
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/next.config.ts ./next.config.ts
COPY --from=builder /app/frontend/postcss.config.js ./postcss.config.js
COPY --from=builder /app/frontend/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/frontend/tsconfig.json ./tsconfig.json
COPY --from=builder /app/frontend/eslint.config.mjs ./eslint.config.mjs
COPY --from=builder /app/frontend/components.json ./components.json
COPY --from=builder /app/frontend/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/frontend/package.json ./package.json

# Expose port 3000
EXPOSE 3000

# Define the start command
CMD ["pnpm", "run", "start"]

# Use a Node.js base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app/frontend

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN pnpm run build

# Expose port 3000
EXPOSE 3000

# Define the start command
CMD ["pnpm", "run", "start"]

# Base Stage: Install dependencies
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy only necessary files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

COPY . .

# Build Stage: Build the Next.js application
FROM base AS build

# Build the application
RUN npm run build

# Production Stage: Serve the application
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Copy only the built application and necessary files from the build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.ts ./next.config.ts

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

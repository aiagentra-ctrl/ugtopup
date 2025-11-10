# Multi-stage build for production-ready React + Vite app
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with npm ci for faster, reproducible builds
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Note: Environment variables with VITE_ prefix must be set during build
RUN npm run build

# Stage 2: Production server with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy templated nginx configuration (will be rendered at container start)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Expose port 80
EXPOSE 80

# Ensure wget and envsubst (from gettext) are available for the healthcheck and templating
RUN apk add --no-cache wget gettext

# Health check for monitoring (uses runtime $PORT; fall back to 80)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c 'wget --quiet --tries=1 --spider "http://localhost:${PORT:-80}" || exit 1'

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

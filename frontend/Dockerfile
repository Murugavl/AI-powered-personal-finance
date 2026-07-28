# Stage 1: Build Vite React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package dependency manifests
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source files
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production web server
FROM nginx:alpine

# Copy custom Nginx SPA routing configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

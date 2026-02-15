# Multi-stage build for Vue 3 frontend
FROM node:24.13.1-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Runtime stage with nginx
FROM nginx:alpine

# Create non-root user
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

# Copy nginx configuration
COPY <<'EOF' /etc/nginx/nginx.conf
worker_processes  auto;

error_log  /tmp/nginx-error.log notice;
pid        /tmp/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Use /tmp for cache directories (writable by non-root)
    client_body_temp_path /tmp/client_temp;
    proxy_temp_path       /tmp/proxy_temp;
    fastcgi_temp_path     /tmp/fastcgi_temp;
    uwsgi_temp_path       /tmp/uwsgi_temp;
    scgi_temp_path        /tmp/scgi_temp;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /tmp/nginx-access.log  main;

    sendfile        on;
    tcp_nopush     on;
    keepalive_timeout  65;
    gzip  on;

    server {
        listen       8080;
        server_name  localhost;

        root   /usr/share/nginx/html;
        index  index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            # This won't be used in production as Ingress handles routing
            # But useful for local Docker testing with docker-compose
            proxy_pass http://video-msg-backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
EOF

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Adjust permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 8080 (non-privileged port)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]

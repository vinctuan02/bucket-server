# Docker Setup Guide

## Yêu cầu

- Docker >= 20.10
- Docker Compose >= 2.0
- Make (optional, nhưng khuyến khích)
- Yarn (đã cài trong Dockerfile)

## Cấu trúc

```
Dockerfile              - Build image cho NestJS app (multi-stage)
docker-compose.yml      - Development environment (all services)
docker-compose.prod.yml - Production environment (all services)
.dockerignore          - Files to ignore when building
.env.example           - Environment variables template
Makefile               - Convenient commands
```

## Quick Start

### 1. Chuẩn bị

```bash
# Copy environment file
cp .env.example .env

# Edit .env với các giá trị của bạn (optional)
# Mặc định đã có giá trị phù hợp cho development
```

### 2. Build & Start (Development)

```bash
# Sử dụng Make (khuyến khích)
make build
make up

# Hoặc sử dụng Docker Compose trực tiếp
docker-compose build
docker-compose up -d
```

### 3. Kiểm tra

```bash
# Xem containers đang chạy
make ps
# hoặc
docker-compose ps

# Xem logs
make logs
# hoặc
docker-compose logs -f

# Xem logs của app
make logs-app
```

### 4. Truy cập

- **API**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
    - Username: `minioadmin`
    - Password: `minioadmin`
- **PostgreSQL**: localhost:5432
    - Username: `postgres`
    - Password: `postgres`
    - Database: `bucket_db`

## Các lệnh hữu ích

### Build & Run

```bash
# Build images
make build

# Start all containers
make up

# Stop all containers
make down

# Restart containers
make restart

# View status
make ps

# Clean up (remove volumes)
make clean
```

### Logs

```bash
# View all logs
make logs

# View app logs
make logs-app

# View database logs
make logs-db

# View MinIO logs
make logs-minio
```

### Shell Access

```bash
# App shell
make shell

# PostgreSQL shell
make db-shell

# MinIO shell
make minio-shell
```

### Testing & Code Quality

```bash
# Run tests
make test

# Run e2e tests
make test-e2e

# Lint code
make lint

# Format code
make format
```

### Production

```bash
# Build production image
make build-prod

# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Stop production environment
docker-compose -f docker-compose.prod.yml down

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Push to registry
make push-prod
```

## Environment Variables

### Database

```env
DB_HOST=postgres          # PostgreSQL host
DB_PORT=5432             # PostgreSQL port
DB_USER=postgres         # PostgreSQL user
DB_PASSWORD=postgres     # PostgreSQL password
DB_NAME=bucket_db        # Database name
```

### MinIO

```env
MINIO_ENDPOINT=minio     # MinIO endpoint
MINIO_PORT=9000          # MinIO port
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=bucket      # Bucket name
MINIO_USE_SSL=false      # Use SSL
```

### Application

```env
PORT=3000                # App port
NODE_ENV=production      # Environment
JWT_SECRET=your-secret   # JWT secret (CHANGE IN PRODUCTION!)
JWT_EXPIRATION=24h       # JWT expiration
```

### Optional

```env
GOOGLE_CLIENT_ID=        # Google OAuth
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

MAIL_HOST=               # Email config
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=

TRASH_EXPIRE_DAYS=30     # Trash retention
```

## Troubleshooting

### Container không start

```bash
# Xem logs chi tiết
make logs-app

# Rebuild image (sẽ cài lại yarn dependencies)
docker-compose build --no-cache
make up
```

### Database connection error

```bash
# Kiểm tra PostgreSQL
make logs-db

# Restart database
docker-compose restart postgres
```

### Port already in use

```bash
# Thay đổi port trong .env
PORT=8082
DB_PORT=5433
MINIO_PORT=9002

# Hoặc kill process đang dùng port
lsof -i :8081
kill -9 <PID>
```

### MinIO không khởi động

```bash
# Xem logs
make logs-minio

# Restart MinIO
docker-compose restart minio
```

### App không connect tới DB

```bash
# Kiểm tra DB logs
make logs-db

# Kiểm tra network
docker network ls
docker network inspect bucket-network

# Restart DB
docker-compose restart postgres
```

## Production Deployment

### 1. Chuẩn bị

```bash
# Copy production env file
cp .env.example .env.prod

# Edit với production values
nano .env.prod
```

### 2. Build & Deploy

```bash
# Build production image
docker build -t bucket-server:1.0.0 .

# Tag for registry
docker tag bucket-server:1.0.0 your-registry/bucket-server:1.0.0

# Push to registry
docker push your-registry/bucket-server:1.0.0
```

### 3. Start Production

```bash
# Sử dụng production compose file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Hoặc sử dụng Make
make up-prod
```

### 4. Monitoring

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health
docker-compose -f docker-compose.prod.yml ps
```

## Security Best Practices

1. **Change JWT Secret**

    ```env
    JWT_SECRET=your-very-long-random-secret-key
    ```

2. **Change MinIO Credentials**

    ```env
    MINIO_ROOT_USER=your-username
    MINIO_ROOT_PASSWORD=your-strong-password
    ```

3. **Change Database Password**

    ```env
    DB_PASSWORD=your-strong-password
    ```

4. **Use HTTPS in Production**
    - Setup reverse proxy (nginx, traefik)
    - Use SSL certificates

5. **Restrict Port Access**
    - Bind to 127.0.0.1 in production
    - Use firewall rules

6. **Regular Backups**

    ```bash
    # Backup database
    docker-compose exec postgres pg_dump -U postgres bucket_db > backup.sql

    # Backup MinIO data
    docker cp bucket-minio:/minio_data ./minio_backup
    ```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
    app:
        deploy:
            replicas: 3
```

### Load Balancing

Use nginx or traefik as reverse proxy:

```nginx
upstream app {
  server app:3000;
  server app:3001;
  server app:3002;
}

server {
  listen 80;
  location / {
    proxy_pass http://app;
  }
}
```

## Useful Docker Commands

```bash
# View all images
docker images

# View all containers
docker ps -a

# Remove image
docker rmi bucket-server:latest

# Remove unused resources
docker system prune -a

# View resource usage
docker stats

# Inspect container
docker inspect bucket-app

# Copy file from container
docker cp bucket-app:/app/dist ./dist

# Execute command in container (using yarn)
docker exec bucket-app yarn test
docker exec bucket-app yarn build
docker exec bucket-app yarn lint
```

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/deployment/docker)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [MinIO Docker Image](https://hub.docker.com/r/minio/minio)

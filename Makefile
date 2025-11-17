.PHONY: help build up down logs clean restart ps

help:
	@echo "Bucket Server - Docker Commands"
	@echo "================================"
	@echo ""
	@echo "Build & Run:"
	@echo "  make build          - Build Docker images"
	@echo "  make up             - Start all containers"
	@echo "  make down           - Stop all containers"
	@echo "  make restart        - Restart all containers"
	@echo ""
	@echo "Logs & Status:"
	@echo "  make logs           - View all logs"
	@echo "  make logs-app       - View app logs"
	@echo "  make logs-db        - View database logs"
	@echo "  make logs-minio     - View MinIO logs"
	@echo "  make ps             - Show running containers"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell          - Open shell in app"
	@echo "  make db-shell       - Open PostgreSQL shell"
	@echo "  make minio-shell    - Open MinIO shell"
	@echo ""
	@echo "Testing & Code Quality:"
	@echo "  make test           - Run tests"
	@echo "  make test-e2e       - Run e2e tests"
	@echo "  make lint           - Run linter"
	@echo "  make format         - Format code"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Remove all containers and volumes"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "✅ All services started"
	@echo "App: http://localhost:8081"
	@echo "MinIO Console: http://localhost:9001"
	@echo "PostgreSQL: localhost:5432"

down:
	docker-compose down
	@echo "✅ All containers stopped"

restart:
	docker-compose restart
	@echo "✅ Containers restarted"

logs:
	docker-compose logs -f

logs-app:
	docker-compose logs -f app

logs-db:
	docker-compose logs -f postgres

logs-minio:
	docker-compose logs -f minio

ps:
	docker-compose ps

clean:
	docker-compose down -v
	@echo "✅ Containers and volumes removed"

shell:
	docker-compose exec app sh

db-shell:
	docker-compose exec postgres psql -U ${DB_USER} -d ${DB_NAME}

minio-shell:
	docker-compose exec minio sh

test:
	docker-compose exec app yarn test

test-e2e:
	docker-compose exec app yarn test:e2e

lint:
	docker-compose exec app yarn lint

format:
	docker-compose exec app yarn format

build-prod:
	docker build -t bucket-server:latest .
	@echo "✅ Production image built"

push-prod:
	docker tag bucket-server:latest your-registry/bucket-server:latest
	docker push your-registry/bucket-server:latest
	@echo "✅ Image pushed to registry"

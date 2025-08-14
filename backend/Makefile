# Makefile для бэкенда платформы госслужащих

.PHONY: help install docker-up docker-down docker-logs docker-clean db-setup health dev build test lint clean logs

# Показать справку
help:
	@echo "Доступные команды:"
	@echo "🔍 ПРОВЕРКА И УСТАНОВКА:"
	@echo "  requirements - Показать требования к системе"
	@echo "  check-deps   - Проверить установленные зависимости"
	@echo "  install      - Установить зависимости"
	@echo ""
	@echo "🚀 БЫСТРЫЙ СТАРТ:"
	@echo "  quickstart   - Полный запуск (Docker + все сервисы)"
	@echo "  dev-local    - Инструкции для локальной разработки"
	@echo "  frontend-only- Запуск только фронтенда"
	@echo ""
	@echo "🐳 DOCKER КОМАНДЫ:"
	@echo "  docker-up    - Запустить все сервисы"
	@echo "  docker-down  - Остановить все сервисы"
	@echo "  docker-logs  - Показать логи всех сервисов"
	@echo "  docker-clean - Очистить Docker"
	@echo ""
	@echo "⚙️ РАЗРАБОТКА:"
	@echo "  dev          - Запустить в режиме разработки"
	@echo "  build        - Собрать все пакеты"
	@echo "  test         - Запустить тесты"
	@echo "  lint         - Проверить код"
	@echo ""
	@echo "🔧 УТИЛИТЫ:"
	@echo "  db-setup     - Настроить базу данных"
	@echo "  health       - Проверить состояние сервисов"
	@echo "  logs         - Показать логи"
	@echo "  clean        - Очистить временные файлы"

# Проверка установленных зависимостей
check-deps:
	@echo "Проверка зависимостей..."
	@echo ""
	@echo "Node.js:"
	@if command -v node >/dev/null 2>&1; then \
		echo "✅ Node.js: $$(node --version)"; \
	else \
		echo "❌ Node.js не установлен"; \
		echo "📖 Установите Node.js: https://nodejs.org/"; \
	fi
	@echo ""
	@echo "npm:"
	@if command -v npm >/dev/null 2>&1; then \
		echo "✅ npm: $$(npm --version)"; \
	else \
		echo "❌ npm не установлен"; \
	fi
	@echo ""
	@echo "Docker:"
	@if command -v docker >/dev/null 2>&1; then \
		echo "✅ Docker: $$(docker --version)"; \
		if docker compose version >/dev/null 2>&1; then \
			echo "✅ Docker Compose: $$(docker compose version --short)"; \
		else \
			echo "❌ Docker Compose не доступен"; \
		fi; \
	else \
		echo "❌ Docker не установлен"; \
		echo "📖 Установите Docker Desktop: https://www.docker.com/products/docker-desktop/"; \
	fi
	@echo ""
	@echo "📖 Полная инструкция по установке в INSTALLATION.md"

# Установка зависимостей
install:
	@echo "Установка зависимостей..."
	@if ! command -v node >/dev/null 2>&1; then \
		echo "❌ Node.js не найден! Установите Node.js сначала."; \
		echo "📖 Смотрите INSTALLATION.md"; \
		exit 1; \
	fi
	npm install

# Запуск всех сервисов с Docker Compose
docker-up:
	@echo "Запуск всех сервисов с Docker Compose..."
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose up -d; \
	elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
		docker compose up -d; \
	else \
		echo "❌ Docker не установлен!"; \
		echo "📖 Смотрите инструкции в INSTALLATION.md"; \
		echo "🔗 Скачайте Docker Desktop: https://www.docker.com/products/docker-desktop/"; \
		exit 1; \
	fi

# Остановка всех сервисов
docker-down:
	@echo "Остановка всех сервисов..."
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose down; \
	elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
		docker compose down; \
	else \
		echo "❌ Docker не найден"; \
	fi

# Просмотр логов всех сервисов
docker-logs:
	@echo "Логи всех сервисов..."
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose logs; \
	elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
		docker compose logs; \
	else \
		echo "❌ Docker не найден"; \
	fi

# Логи конкретного сервиса
logs-%:
	@echo "Логи сервиса $*..."
	docker-compose logs -f $*

# Очистка Docker
docker-clean:
	@echo "Очистка Docker..."
	docker-compose down -v
	docker system prune -f

# Настройка базы данных
db-setup:
	@echo "Настройка базы данных..."
	sleep 10
	docker-compose exec postgres psql -U postgres -d gov_platform -c "SELECT 1;"
	@echo "База данных готова!"

# Подключение к базе данных
db-connect:
	@echo "Подключение к базе данных..."
	docker-compose exec postgres psql -U postgres -d gov_platform

# Проверка состояния всех сервисов
health:
	@echo "Проверка состояния сервисов..."
	@curl -s http://localhost:8080/health | jq '.' || echo "API Gateway недоступен"
	@curl -s http://localhost:3001/api/v1/health | jq '.' || echo "Auth Service недоступен"
	@curl -s http://localhost:3002/api/v1/health | jq '.' || echo "User Service недоступен"
	@curl -s http://localhost:3003/api/v1/health | jq '.' || echo "Chat Service недоступен"
	@curl -s http://localhost:3004/api/v1/health | jq '.' || echo "File Service недоступен"

# Разработка всех сервисов с Turbo
dev:
	@echo "Запуск всех сервисов в режиме разработки с Turbo..."
	@if ! command -v node >/dev/null 2>&1; then \
		echo "❌ Node.js не найден!"; \
		echo "📖 Установите Node.js: https://nodejs.org/"; \
		exit 1; \
	fi
	npm run dev

# Разработка отдельных сервисов
auth-dev:
	@echo "Запуск Auth Service в режиме разработки..."
	npm run dev --workspace=@gov-platform/auth-service

user-dev:
	@echo "Запуск User Service в режиме разработки..."
	npm run dev --workspace=@gov-platform/user-service

chat-dev:
	@echo "Запуск Chat Service в режиме разработки..."
	npm run dev --workspace=@gov-platform/chat-service

file-dev:
	@echo "Запуск File Service в режиме разработки..."
	npm run dev --workspace=@gov-platform/file-service

gateway-dev:
	@echo "Запуск API Gateway в режиме разработки..."
	npm run dev --workspace=@gov-platform/api-gateway

# Сборка
build:
	@echo "Сборка всех пакетов..."
	npm run build

# Тестирование
test:
	@echo "Запуск тестов..."
	npm run test

# Проверка кода
lint:
	@echo "Проверка кода..."
	npm run lint

# Просмотр логов
logs:
	@echo "Логи сервисов..."
	docker-compose logs -f

# Очистка
clean:
	@echo "Очистка временных файлов..."
	rm -rf node_modules/.cache
	rm -rf apps/*/dist
	rm -rf packages/*/dist
	npm run clean

# Backup базы данных
backup:
	@echo "Создание backup базы данных..."
	docker-compose exec postgres pg_dump -U postgres gov_platform > backup-$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup создан: backup-$(shell date +%Y%m%d_%H%M%S).sql"

# Restore базы данных
restore:
	@echo "Восстановление базы данных из backup..."
	@read -p "Введите имя файла backup: " file; \
	docker-compose exec -T postgres psql -U postgres gov_platform < $$file

# Рестарт всех сервисов
restart:
	@echo "Перезапуск всех сервисов..."
	docker-compose restart

# Обновление зависимостей
update:
	@echo "Обновление зависимостей..."
	npm update

# Установка новой зависимости
install-dep:
	@read -p "Введите название пакета: " package; \
	npm install $$package

# Показать статус контейнеров
status:
	@echo "Статус контейнеров:"
	docker-compose ps

# Мониторинг ресурсов
monitor:
	@echo "Мониторинг ресурсов..."
	docker stats

# Проверка портов
ports:
	@echo "Используемые порты:"
	@echo "3001 - Auth Service"
	@echo "3002 - User Service"
	@echo "3003 - Chat Service"
	@echo "3004 - File Service"
	@echo "8080 - API Gateway"
	@echo "5432 - PostgreSQL"
	@echo "6379 - Redis"
	@echo "9200 - Elasticsearch"
	@echo "9000 - MinIO API"
	@echo "9001 - MinIO Console"
	@echo "5672 - RabbitMQ"
	@echo "15672 - RabbitMQ Management"

# Alternative: local development without full Docker
dev-local:
	@echo "🔧 Запуск локальной разработки..."
	@echo "Этот режим запускает сервисы локально (нужен Node.js)"
	@echo ""
	@if ! command -v node >/dev/null 2>&1; then \
		echo "❌ Node.js не найден!"; \
		echo "📖 Установите Node.js: https://nodejs.org/"; \
		exit 1; \
	fi
	@echo "✅ Node.js найден: $$(node --version)"
	@echo ""
	@echo "📋 Варианты запуска:"
	@echo ""
	@echo "🚀 АВТОМАТИЧЕСКИ (рекомендуется):"
	@echo "   make dev                    # Запустить все сервисы с Turbo"
	@echo ""
	@echo "🔧 ВРУЧНУЮ в отдельных терминалах:"
	@echo "1. cd apps/auth-service && npm install && npm run dev"
	@echo "2. cd apps/user-service && npm install && npm run dev"
	@echo "3. cd apps/chat-service && npm install && npm run dev"
	@echo "4. cd apps/file-service && npm install && npm run dev"
	@echo "5. cd apps/api-gateway && npm install && npm run dev"
	@echo ""
	@echo "🌐 Фронтенд: cd ../frontend/frontend-shell && npm install && npm run dev"

# Frontend only development
frontend-only:
	@echo "🎨 Для запуска только фронтенда:"
	@echo ""
	@echo "cd ../frontend/frontend-shell"
	@echo "npm install"
	@echo "npm run dev"
	@echo ""
	@echo "📖 Подробная инструкция: ../QUICK_START_NO_DOCKER.md"

# Check what's needed
requirements:
	@echo "📋 Требования для запуска платформы:"
	@echo ""
	@echo "🔧 Обязательно:"
	@echo "- Node.js 18+ (для разработки): https://nodejs.org/"
	@echo "- Docker Desktop (для полного стека): https://www.docker.com/products/docker-desktop/"
	@echo ""
	@echo "📊 Варианты запуска:"
	@echo "1. 'make quickstart' - полный стек с Docker"
	@echo "2. 'make dev-local' - инструкции для локальной разработки"
	@echo "3. 'make frontend-only' - только фронтенд для UI разработки"
	@echo ""
	@echo "🔍 Проверить установленное: 'make check-deps'"

# Quick start with Docker check
quickstart: check-deps install docker-up db-setup
	@echo "🚀 Бэкенд запущен! Доступные URL:"
	@echo "- API Gateway: http://localhost:8080"
	@echo "- Health Check: http://localhost:8080/health"
	@echo "- MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
	@echo "- RabbitMQ Management: http://localhost:15672 (rabbitmq/rabbitmq123)"
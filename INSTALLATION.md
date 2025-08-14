# 🚀 Инструкция по установке платформы госслужащих

## 📋 Требования к системе

### Минимальные требования:
- **macOS**: 10.15+ (Catalina и выше)
- **RAM**: 8 ГБ (рекомендуется 16 ГБ)
- **Свободное место**: 10 ГБ
- **Процессор**: Intel или Apple Silicon

### Необходимое ПО:
- **Node.js** 18+ и npm
- **Docker Desktop** для контейнеризации
- **Git** для работы с репозиторием

## 🛠️ Установка зависимостей

### 1. Установка Node.js

**Вариант А: Через официальный сайт**
```bash
# Скачайте и установите с https://nodejs.org/
# Выберите LTS версию (18.x или выше)
```

**Вариант Б: Через Homebrew**
```bash
# Установите Homebrew (если не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установите Node.js
brew install node@18
```

**Проверка установки:**
```bash
node --version  # должна быть 18.x+
npm --version   # должна быть 8.x+
```

### 2. Установка Docker Desktop

**Скачайте Docker Desktop:**
- Перейдите на https://www.docker.com/products/docker-desktop/
- Скачайте версию для Mac (Intel или Apple Silicon)
- Установите и запустите Docker Desktop
- Дождитесь полного запуска (зеленый индикатор)

**Проверка установки:**
```bash
docker --version          # Docker version 20.x+
docker compose version    # Docker Compose version v2.x+
```

### 3. Установка Git (если не установлен)

```bash
# Через Homebrew
brew install git

# Или скачайте с https://git-scm.com/download/mac
```

## 🚀 Способы запуска

### Способ 1: Полный Docker запуск (рекомендуется)

```bash
# 1. Перейдите в папку backend
cd backend

# 2. Установите зависимости
npm install

# 3. Запустите все сервисы в Docker
docker compose up -d

# 4. Настройте базу данных
make db-setup

# 5. Проверьте состояние
make health
```

### Способ 2: Локальная разработка (без Docker для сервисов)

**Запуск инфраструктуры в Docker:**
```bash
cd backend

# Запустите только инфраструктуру (БД, Redis, etc.)
docker compose up -d postgres redis elasticsearch minio rabbitmq nginx
```

**Запуск сервисов локально:**
```bash
# В отдельных терминалах запустите каждый сервис:

# Терминал 1 - Auth Service
cd backend/apps/auth-service
npm install
npm run dev

# Терминал 2 - User Service  
cd backend/apps/user-service
npm install
npm run dev

# Терминал 3 - Chat Service
cd backend/apps/chat-service
npm install 
npm run dev

# Терминал 4 - File Service
cd backend/apps/file-service
npm install
npm run dev

# Терминал 5 - API Gateway
cd backend/apps/api-gateway
npm install
npm run dev
```

### Способ 3: Только фронтенд (для UI разработки)

```bash
# Запустите фронтенд с mock данными
cd frontend/frontend-shell
npm install
npm run dev

# Откройте http://localhost:3000
```

## 🔧 Настройка окружения

### Переменные окружения

Создайте файл `.env` в папке `backend/` на основе `.env.example`:

```bash
cd backend
cp .env.example .env
```

**Отредактируйте `.env`:**
```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/gov_platform

# Redis
REDIS_URL=redis://:redis123@localhost:6379

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# RabbitMQ
RABBITMQ_URL=amqp://rabbitmq:rabbitmq123@localhost:5672

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
```

## 🧪 Проверка установки

### Проверка бэкенда:

```bash
# Проверьте все сервисы
curl http://localhost:8080/health

# Проверьте отдельные сервисы
curl http://localhost:3001/api/v1/health  # Auth
curl http://localhost:3002/api/v1/health  # User
curl http://localhost:3003/api/v1/health  # Chat
curl http://localhost:3004/api/v1/health  # File
```

### Проверка фронтенда:

```bash
# Откройте в браузере
open http://localhost:3000

# Тестовые данные для входа:
# Email: admin@gov.kz
# ЭЦП: test-signature-123
```

### Проверка инфраструктуры:

| Сервис | URL | Логин/Пароль |
|--------|-----|--------------|
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin123 |
| **RabbitMQ Management** | http://localhost:15672 | rabbitmq / rabbitmq123 |
| **Elasticsearch** | http://localhost:9200 | - |
| **PostgreSQL** | localhost:5432 | postgres / postgres123 |
| **Redis** | localhost:6379 | пароль: redis123 |

## 🐛 Устранение проблем

### Docker не запускается

```bash
# Проверьте статус Docker Desktop
docker info

# Перезапустите Docker Desktop
# Через GUI: Docker Desktop -> Restart

# Очистите Docker cache
docker system prune -a
```

### Порты заняты

```bash
# Найдите процессы на портах
lsof -i :3000  # Фронтенд
lsof -i :8080  # API Gateway
lsof -i :5432  # PostgreSQL

# Завершите процесс
kill -9 <PID>
```

### Ошибки установки npm

```bash
# Очистите npm cache
npm cache clean --force

# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install
```

### Проблемы с базой данных

```bash
# Пересоздайте базу данных
cd backend
docker compose down postgres
docker compose up -d postgres
sleep 10
make db-setup
```

### Ошибки памяти

```bash
# Увеличьте лимиты Node.js
export NODE_OPTIONS="--max-old-space-size=8192"

# Для Docker увеличьте лимиты в Docker Desktop:
# Settings -> Resources -> Memory: 8GB+
```

## 📱 Альтернативные варианты

### Разработка только фронтенда

Если нужно работать только с UI:

```bash
cd frontend/frontend-shell
npm install
npm run dev

# Фронтенд будет работать с mock данными
# API запросы будут симулироваться
```

### Использование готового облачного бэкенда

Если есть развернутый бэкенд в облаке:

```bash
# В frontend/frontend-shell/.env
VITE_API_BASE_URL=https://your-backend-url.com/api/v1
VITE_WS_URL=https://your-backend-url.com
```

### Запуск в режиме разработки

Для быстрой разработки без Docker:

```bash
# Установите все зависимости
cd backend && npm install
cd ../frontend/frontend-shell && npm install

# Запустите только необходимые сервисы
cd ../../backend
npm run dev:auth &    # Auth service
npm run dev:user &    # User service  
npm run dev:api &     # API Gateway

cd ../frontend/frontend-shell
npm run dev
```

## 🆘 Получение помощи

### Логи и отладка

```bash
# Логи всех Docker контейнеров
cd backend && docker compose logs

# Логи конкретного сервиса
docker compose logs auth-service -f

# Логи фронтенда
cd frontend/frontend-shell && npm run dev
```

### Контакты поддержки

- **Email**: support@gov-platform.kz
- **Документация**: Файлы в папке `docs/`
- **Issues**: Создавайте в репозитории

### Полезные команды

```bash
# Полная перезагрузка
cd backend
make docker-down
make docker-clean
make docker-up
make db-setup

# Быстрый старт
make quickstart

# Проверка состояния
make health
```

---

**🇰🇿 Успешной разработки для государственных служащих Казахстана!**

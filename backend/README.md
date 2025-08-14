# 🔧 Бэкенд платформы госслужащих

Микросервисная архитектура на Node.js + TypeScript с полным набором сервисов для государственной платформы коммуникаций Казахстана.

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (8080)                       │
├─────────────────────────────────────────────────────────────────┤
│ Auth Service │ User Service │ Chat Service │ File Service       │
│    (3001)    │    (3002)    │    (3003)    │    (3004)         │
├─────────────────────────────────────────────────────────────────┤
│ PostgreSQL │ Redis │ ElasticSearch │ MinIO │ RabbitMQ │ Nginx   │
│   (5432)   │ (6379)│    (9200)     │ (9000)│  (5672)  │ (80)   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Быстрый старт

### Требования
- Docker и Docker Compose
- Node.js 18+ (для разработки)
- Make (опционально)

### Установка

```bash
# 1. Установка зависимостей
make install
# или
npm install

# 2. Запуск всех сервисов
make docker-up
# или
docker-compose up -d

# 3. Настройка базы данных
make db-setup

# 4. Проверка состояния
make health
# или
curl http://localhost:8080/health
```

## 📊 Сервисы

### Auth Service (3001)
- Аутентификация через ЭЦП
- JWT токены (Access + Refresh)
- Управление сессиями в Redis
- Rate limiting для безопасности

### User Service (3002)  
- Управление профилями пользователей
- Система контактов
- Поиск через Elasticsearch
- Кэширование в Redis

### Chat Service (3003)
- Real-time чаты через WebSocket
- E2E шифрование сообщений
- Поддержка групп и каналов
- Typing indicators

### File Service (3004)
- S3-совместимое хранилище (MinIO)
- Обработка изображений и видео
- Генерация превью документов
- Шифрование файлов

### API Gateway (8080)
- Единая точка входа
- Load balancing
- Health monitoring
- Rate limiting

## 💾 Инфраструктура

### PostgreSQL (5432)
- Основное хранилище данных
- Drizzle ORM с миграциями
- 12 основных таблиц
- Индексы для производительности

### Redis (6379)
- Кэширование профилей
- Хранение сессий
- Pub/Sub для real-time
- Rate limiting счетчики

### MinIO (9000/9001)
- S3-совместимое хранилище
- Bucket структура по типам файлов
- Lifecycle правила
- Encryption at rest

### Elasticsearch (9200)
- Полнотекстовый поиск пользователей
- Русский анализатор
- Автодополнение
- Агрегации по отделам

### RabbitMQ (5672/15672)
- Асинхронная обработка задач
- Очереди для файлов и уведомлений
- Dead letter queues
- High availability

## 🔧 Команды разработки

```bash
# Запуск отдельных сервисов
make auth-dev         # Auth Service
make user-dev         # User Service  
make chat-dev         # Chat Service
make file-dev         # File Service

# Общие команды
make dev              # Все сервисы в dev режиме
make build            # Сборка всех пакетов
make test             # Запуск тестов
make lint             # Проверка кода
make logs             # Просмотр логов

# Docker команды
make docker-up        # Запуск всех контейнеров
make docker-down      # Остановка контейнеров
make docker-logs      # Логи контейнеров
make docker-clean     # Очистка Docker
```

## 🛡️ Безопасность

### Аутентификация
- Электронная цифровая подпись (ЭЦП)
- JWT токены с коротким TTL (15 мин)
- Refresh токены (7 дней)
- Session management в Redis

### Шифрование
- E2E шифрование чатов (AES-256-GCM)
- Шифрование файлов в хранилище
- TLS для всех соединений
- Подписанные URL для файлов

### Защита
- Rate limiting на всех уровнях
- Валидация входных данных (Zod)
- CORS настройки
- Security headers
- Audit logging

## 📋 API Эндпоинты

### Аутентификация
```http
POST /api/v1/auth/login           # Вход через ЭЦП
POST /api/v1/auth/refresh         # Обновление токена
POST /api/v1/auth/logout          # Выход
GET  /api/v1/auth/me              # Текущий пользователь
```

### Пользователи
```http
GET  /api/v1/users/profile        # Профиль
PUT  /api/v1/users/profile        # Обновление профиля
GET  /api/v1/users/search         # Поиск пользователей
POST /api/v1/users/contacts       # Добавить контакт
```

### Чаты
```http
POST /api/v1/chats                # Создать чат
GET  /api/v1/chats/user           # Чаты пользователя
POST /api/v1/chats/messages       # Отправить сообщение
GET  /api/v1/chats/{id}/messages  # Сообщения чата
```

### Файлы
```http
POST /api/v1/files/upload         # Загрузить файл
GET  /api/v1/files/{id}/download  # Скачать файл
GET  /api/v1/files/{id}/preview   # Предпросмотр
DELETE /api/v1/files/{id}         # Удалить файл
```

## 🔍 Мониторинг

### Health Checks
```bash
# Общее состояние
curl http://localhost:8080/health

# Отдельные сервисы
curl http://localhost:3001/api/v1/health  # Auth
curl http://localhost:3002/api/v1/health  # User
curl http://localhost:3003/api/v1/health  # Chat
curl http://localhost:3004/api/v1/health  # File
```

### Логи
```bash
# Все сервисы
make logs

# Отдельные сервисы
docker-compose logs auth-service
docker-compose logs -f chat-service
```

## 📊 Производительность

### Ожидаемые характеристики
- Concurrent users: 1000+
- Messages per second: 100+
- File uploads: 50 concurrent
- Response time API: <200ms (p95)
- WebSocket latency: <50ms

### Оптимизации
- Connection pooling
- Database query optimization
- Redis caching
- File streaming
- Compression на всех уровнях

## 🧪 Тестирование

```bash
# Unit тесты
make test

# Integration тесты
make test-integration

# Load тесты
make test-load

# Security тесты
make test-security
```

## 📦 Структура пакетов

```
backend/
├── apps/                     # Микросервисы
│   ├── auth-service/         
│   ├── user-service/         
│   ├── chat-service/         
│   ├── file-service/         
│   └── api-gateway/          
├── packages/                 # Общие пакеты
│   ├── types/               # TypeScript типы
│   └── database/            # Схемы БД
├── infrastructure/          # Инфраструктура
│   ├── docker/              # Docker конфиги
│   └── kubernetes/          # K8s манифесты
├── docker-compose.yml       # Локальная разработка
└── Makefile                 # Команды автоматизации
```

## 🚢 Развертывание

### Docker Compose (разработка)
```bash
docker-compose up -d
```

### Kubernetes (продакшен)
```bash
kubectl apply -f infrastructure/kubernetes/
```

### Переменные окружения
```bash
# .env файл
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://password@host:port
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## 📚 Документация

- **[Полное описание бэкенда](../BACKEND_DESCRIPTION.txt)** - детальная техническая документация
- **[API документация](http://localhost:8080/api/docs)** - Swagger документация
- **[Архитектурные решения](./docs/architecture.md)** - ADR документы

## 🤝 Разработка

### Добавление нового сервиса
1. Создайте папку в `apps/`
2. Скопируйте структуру из существующего сервиса
3. Обновите `docker-compose.yml`
4. Добавьте роуты в API Gateway
5. Обновите документацию

### Code Style
- TypeScript строгий режим
- ESLint + Prettier
- Conventional Commits
- Semantic versioning

---

**🔧 Готов к продакшену!** Запустите `make docker-up` и начинайте разработку!

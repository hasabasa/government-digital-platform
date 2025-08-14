# Руководство по развертыванию

## Быстрый старт

### 1. Подготовка окружения

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd gov-platform

# Скопируйте и настройте переменные окружения
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### 2. Запуск с Docker Compose

```bash
# Установка зависимостей
make install

# Запуск всей инфраструктуры
make docker-up

# Настройка базы данных
make db-setup

# Проверка статуса
make health
```

### 3. Доступные сервисы

| Сервис | URL | Описание |
|--------|-----|----------|
| API Gateway | http://localhost:8080 | Единая точка входа |
| Auth Service | http://localhost:3001 | Аутентификация |
| User Service | http://localhost:3002 | Управление пользователями |
| Chat Service | http://localhost:3003 | Мессенджер + WebSocket |
| File Service | http://localhost:3004 | Управление файлами |
| PostgreSQL | localhost:5432 | База данных |
| Redis | localhost:6379 | Кэш и сессии |
| MinIO | http://localhost:9001 | Файловое хранилище |
| Elasticsearch | http://localhost:9200 | Поиск |
| RabbitMQ | http://localhost:15672 | Очереди сообщений |

## API Эндпоинты

### Аутентификация
```http
POST /api/v1/auth/login           # Вход через ЭЦП
POST /api/v1/auth/refresh         # Обновление токена
POST /api/v1/auth/logout          # Выход
GET  /api/v1/auth/me              # Текущий пользователь
```

### Пользователи
```http
GET  /api/v1/users/profile        # Профиль пользователя
PUT  /api/v1/users/profile        # Обновление профиля
GET  /api/v1/users/search         # Поиск пользователей
POST /api/v1/users/contacts       # Добавить контакт
GET  /api/v1/users/contacts/list  # Список контактов
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
GET  /api/v1/files/{id}           # Информация о файле
GET  /api/v1/files/{id}/download  # Скачать файл
GET  /api/v1/files/{id}/preview   # Предпросмотр файла
```

### WebSocket (Чаты)
```javascript
// Подключение к WebSocket
const socket = io('http://localhost:8080', {
  auth: { token: 'your-jwt-token' }
});

// События
socket.emit('join_chat', { chatId: 'uuid' });
socket.emit('send_message', { chatId: 'uuid', content: 'text' });
socket.on('message:new', (message) => console.log(message));
```

## Разработка

### Команды разработки

```bash
# Разработка отдельных сервисов
make auth-service      # Запуск Auth Service
make user-service      # Запуск User Service
make chat-service      # Запуск Chat Service
make file-service      # Запуск File Service

# Общие команды
make dev              # Запуск всех сервисов в dev режиме
make build            # Сборка всех пакетов
make test             # Запуск тестов
make lint             # Проверка кода
```

### Структура проекта

```
gov-platform/
├── apps/                     # Микросервисы
│   ├── auth-service/         # Аутентификация
│   ├── user-service/         # Пользователи
│   ├── chat-service/         # Чаты
│   ├── file-service/         # Файлы
│   ├── api-gateway/          # API Gateway
│   └── frontend-shell/       # Frontend
├── packages/                 # Общие пакеты
│   ├── types/               # TypeScript типы
│   ├── database/            # Схемы БД
│   ├── ui/                  # UI компоненты
│   └── config/              # Конфигурации
└── infrastructure/          # Инфраструктура
    ├── docker/              # Docker конфиги
    └── kubernetes/          # K8s манифесты
```

## Производственное развертывание

### Kubernetes

```bash
# Развертывание в Kubernetes
kubectl apply -f infrastructure/kubernetes/

# Проверка статуса
kubectl get pods -n gov-platform
```

### Переменные окружения для продакшена

```bash
# Безопасность
JWT_ACCESS_SECRET=your-super-secure-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
FILE_ENCRYPTION_KEY=your-file-encryption-key

# База данных
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://password@host:port

# Внешние сервисы
S3_ENDPOINT=https://your-s3-endpoint
ELASTICSEARCH_URL=https://your-elasticsearch-cluster
RABBITMQ_URL=amqp://user:password@host:port

# Домены
ALLOWED_ORIGINS=https://your-domain.com
```

## Мониторинг и логи

### Проверка состояния

```bash
# Общее состояние системы
curl http://localhost:8080/health

# Состояние отдельных сервисов
curl http://localhost:3001/api/v1/health  # Auth
curl http://localhost:3002/api/v1/health  # User
curl http://localhost:3003/api/v1/health  # Chat
curl http://localhost:3004/api/v1/health  # File
```

### Логи

```bash
# Логи всех сервисов
make docker-logs

# Логи отдельных сервисов
make logs-auth
make logs-nginx
make logs-postgres
```

## Безопасность

### Основные принципы

1. **Аутентификация через ЭЦП** - все пользователи аутентифицируются через электронную цифровую подпись
2. **E2E шифрование** - сообщения шифруются между клиентами
3. **Шифрование файлов** - файлы шифруются в хранилище
4. **Rate limiting** - защита от DDoS атак
5. **Валидация данных** - все входные данные проверяются
6. **Аудит** - все действия логируются

### Конфигурация безопасности

```bash
# Включение шифрования
E2E_ENCRYPTION_ENABLED=true
FILE_ENCRYPTION_ENABLED=true

# Настройка rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Настройка CORS
ALLOWED_ORIGINS=https://trusted-domain.com
```

## Резервное копирование

### База данных

```bash
# Создание бэкапа
docker-compose exec postgres pg_dump -U postgres gov_platform > backup.sql

# Восстановление
docker-compose exec -T postgres psql -U postgres gov_platform < backup.sql
```

### Файлы

```bash
# Бэкап MinIO
mc cp --recursive minio/gov-platform-files backup/files/

# Восстановление
mc cp --recursive backup/files/ minio/gov-platform-files
```

## Устранение неполадок

### Проблемы с подключением

1. Проверьте статус сервисов: `make health`
2. Проверьте логи: `make docker-logs`
3. Убедитесь, что все порты открыты
4. Проверьте переменные окружения

### Проблемы с базой данных

1. Проверьте подключение: `make db-connect`
2. Запустите миграции: `make migrate`
3. Проверьте логи PostgreSQL: `make logs-postgres`

### Проблемы с файлами

1. Проверьте доступность MinIO: http://localhost:9001
2. Убедитесь, что bucket создан
3. Проверьте права доступа к файлам

## Контакты

- **Техническая поддержка**: support@gov-platform.ru
- **Документация**: https://docs.gov-platform.ru
- **Issues**: https://github.com/gov-platform/issues

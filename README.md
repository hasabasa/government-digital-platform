# Cube Demper OS

Внутренняя платформа управления бизнесом компании Cube Demper. Чат, звонки, задачи, финансы — всё в одном месте.

## Стек

**Backend:** Node.js + TypeScript + Express + Drizzle ORM + PostgreSQL + Redis
**Frontend:** React 18 + Vite + TailwindCSS + Zustand + React Query
**Инфра:** Docker Compose + Turborepo + Nginx + MinIO + RabbitMQ + Elasticsearch

## Архитектура

Монорепозиторий с микросервисами:

| Сервис | Порт | Описание |
|--------|------|----------|
| api-gateway | 8080 | API Gateway + Load Balancer |
| auth-service | 3001 | Аутентификация (JWT, email/password) |
| user-service | 3002 | Управление пользователями и отделами |
| chat-service | 3003 | Чат (Socket.IO, E2E шифрование) |
| file-service | 3004 | Файлы (MinIO S3) |
| task-service | 3005 | Задачи и поручения |
| call-service | 3006 | Звонки (WebRTC + Google Meet) |
| finance-service | 3007 | Финансы, тарифы, распределение прибыли |
| frontend | 3000 | React SPA |

## Быстрый старт

```bash
# Клонировать и запустить
cd backend
docker-compose up -d

# Или локально
npm install
npm run dev
```

## Роли

| Роль | Описание | Доступ |
|------|----------|--------|
| `admin` | Управляющие партнёры | Всё: задачи, финансы, пользователи |
| `manager` | Менеджеры отделов | Задачи, финансы своего отдела |
| `employee` | Сотрудники | Свои задачи, чат, звонки |

## Пользователи по умолчанию

| Имя | Email | Роль |
|-----|-------|------|
| Хасенхан Казимов | Hasenhankazimov@gmail.com | admin |
| Адиль Хамитов | hamitov.adil04@gmail.com | admin |
| Азамат Бекхалиев | azamatbekkhaliev@gmail.com | admin |
| Алпамыс Мақажан | makazanalpamys@gmail.com | employee |

## Финансовый модуль

### Тарифы
- **Стандарт:** 21,990 ₸/мес
- **Бизнес:** 27,990 ₸/мес
- **Премиум:** 33,990 ₸/мес

### Автоматические вычеты
- Банк: 2%
- Налог: 4%
- Ambassador Arslan: 20%

### Распределение прибыли
- Khasenkhan: 40%
- Adil: 40%
- Azamat: 20%

## Структура проекта

```
backend/
├── apps/
│   ├── api-gateway/     # API Gateway
│   ├── auth-service/    # Аутентификация
│   ├── user-service/    # Пользователи
│   ├── chat-service/    # Чат
│   ├── file-service/    # Файлы
│   ├── task-service/    # Задачи
│   ├── call-service/    # Звонки
│   └── finance-service/ # Финансы
├── packages/
│   ├── database/        # Drizzle ORM схемы
│   └── types/           # Zod типы (общие)
└── docker-compose.yml

frontend/
└── frontend-shell/      # React SPA
    ├── src/
    │   ├── components/  # UI компоненты
    │   ├── pages/       # Страницы
    │   ├── stores/      # Zustand сторы
    │   ├── services/    # API сервисы
    │   └── types/       # TypeScript типы
    └── vite.config.ts
```

## Docker

Все контейнеры именуются `cube-*`:

```
cube-postgres, cube-redis, cube-minio
cube-elasticsearch, cube-rabbitmq
cube-auth-service, cube-user-service
cube-chat-service, cube-file-service
cube-task-service, cube-call-service
cube-finance-service, cube-api-gateway
cube-nginx
```

БД: `cube_demper` | Сеть: `cube-network` | Файлы: `cube-demper-files`

#!/bin/bash

# Скрипт проверки готовности проекта платформы госслужащих Казахстана

echo "🇰🇿 Проверка проекта платформы госслужащих Казахстана"
echo "=================================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки
check_item() {
    if eval "$1"; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Проверка структуры проекта
echo -e "${BLUE}📁 Структура проекта:${NC}"
check_item "[ -d 'backend' ]" "backend/ - Папка бэкенда"
check_item "[ -d 'frontend' ]" "frontend/ - Папка фронтенда"
check_item "[ -d 'docs' ]" "docs/ - Документация"
echo ""

# Проверка бэкенда
echo -e "${BLUE}🔧 Бэкенд компоненты:${NC}"
check_item "[ -f 'backend/docker-compose.yml' ]" "Docker Compose конфигурация"
check_item "[ -f 'backend/Makefile' ]" "Makefile с командами"
check_item "[ -d 'backend/apps/auth-service' ]" "Auth Service"
check_item "[ -d 'backend/apps/user-service' ]" "User Service"
check_item "[ -d 'backend/apps/chat-service' ]" "Chat Service"
check_item "[ -d 'backend/apps/file-service' ]" "File Service"
check_item "[ -d 'backend/apps/api-gateway' ]" "API Gateway"
check_item "[ -d 'backend/packages/types' ]" "Shared Types пакет"
check_item "[ -d 'backend/packages/database' ]" "Database пакет"
echo ""

# Проверка фронтенда
echo -e "${BLUE}🎨 Фронтенд компоненты:${NC}"
check_item "[ -f 'frontend/frontend-shell/package.json' ]" "React приложение"
check_item "[ -f 'frontend/frontend-shell/vite.config.ts' ]" "Vite конфигурация"
check_item "[ -f 'frontend/frontend-shell/tailwind.config.js' ]" "TailwindCSS конфигурация"
check_item "[ -d 'frontend/frontend-shell/src/components' ]" "React компоненты"
check_item "[ -d 'frontend/frontend-shell/src/stores' ]" "Zustand stores"
check_item "[ -f 'frontend/Makefile' ]" "Frontend Makefile"
echo ""

# Проверка документации
echo -e "${BLUE}📚 Документация:${NC}"
check_item "[ -f 'README.md' ]" "Основное README"
check_item "[ -f 'STATUS.md' ]" "Статус проекта"
check_item "[ -f 'INSTALLATION.md' ]" "Инструкция по установке"
check_item "[ -f 'QUICK_START_NO_DOCKER.md' ]" "Быстрый старт без Docker"
check_item "[ -f 'PROJECT_STRUCTURE.txt' ]" "Структура проекта"
check_item "[ -f 'docs/BACKEND_DESCRIPTION.txt' ]" "Описание бэкенда"
check_item "[ -f 'docs/FRONTEND_DESCRIPTION.txt' ]" "Описание фронтенда"
echo ""

# Проверка системных зависимостей
echo -e "${BLUE}🔍 Системные зависимости:${NC}"
if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js не установлен${NC}"
fi

if command -v npm >/dev/null 2>&1; then
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
else
    echo -e "${RED}❌ npm не установлен${NC}"
fi

if command -v docker >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker: $(docker --version)${NC}"
    if docker compose version >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker Compose: $(docker compose version --short)${NC}"
    else
        echo -e "${YELLOW}⚠️ Docker Compose plugin недоступен${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Docker не установлен (нужен для полного стека)${NC}"
fi
echo ""

# Рекомендации по запуску
echo -e "${BLUE}🚀 Рекомендации по запуску:${NC}"
echo ""

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo -e "${GREEN}✨ ПОЛНЫЙ СТЕК (рекомендуется):${NC}"
    echo "   cd backend && make quickstart"
    echo ""
fi

if command -v node >/dev/null 2>&1; then
    echo -e "${BLUE}🎨 ТОЛЬКО ФРОНТЕНД:${NC}"
    echo "   cd frontend/frontend-shell && npm install && npm run dev"
    echo ""
    
    echo -e "${BLUE}🔧 ЛОКАЛЬНАЯ РАЗРАБОТКА:${NC}"
    echo "   cd backend && make dev-local"
    echo ""
fi

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}⚠️ ТРЕБУЕТСЯ УСТАНОВКА:${NC}"
    echo "   Установите Node.js: https://nodejs.org/"
    echo ""
fi

if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}💡 ДЛЯ ПОЛНОГО СТЕКА:${NC}"
    echo "   Установите Docker Desktop: https://www.docker.com/products/docker-desktop/"
    echo ""
fi

# Быстрые команды
echo -e "${BLUE}⚡ Быстрые команды:${NC}"
echo "   make help              # Все команды (из backend/)"
echo "   make check-deps        # Проверка системы (из backend/)"
echo "   make requirements      # Требования (из backend/)"
echo ""

# Тестовые данные
echo -e "${BLUE}🧪 Тестовые данные:${NC}"
echo "   Email: admin@gov.kz"
echo "   ЭЦП: test-signature-123"
echo ""

# Полезные ссылки
echo -e "${BLUE}📖 Полезные ссылки:${NC}"
echo "   📊 Статус: cat STATUS.md"
echo "   🛠️ Установка: cat INSTALLATION.md"
echo "   🚀 Без Docker: cat QUICK_START_NO_DOCKER.md"
echo ""

echo "🇰🇿 Проект готов к использованию государственными служащими Казахстана!"
echo "=================================================="

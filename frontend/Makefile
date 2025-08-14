# Makefile для фронтенда платформы госслужащих

.PHONY: help install dev build preview test lint clean docker-build docker-run

# Показать справку
help:
	@echo "Доступные команды для фронтенда:"
	@echo "  install      - Установить зависимости"
	@echo "  dev          - Запустить dev сервер"
	@echo "  build        - Собрать для продакшена"
	@echo "  preview      - Просмотр prod сборки"
	@echo "  test         - Запустить тесты"
	@echo "  test-watch   - Тесты в watch режиме"
	@echo "  lint         - Проверить код"
	@echo "  lint-fix     - Исправить ошибки линтера"
	@echo "  type-check   - Проверка TypeScript"
	@echo "  analyze      - Анализ размера бандла"
	@echo "  clean        - Очистить временные файлы"
	@echo "  docker-build - Собрать Docker образ"
	@echo "  docker-run   - Запустить в Docker"

# Установка зависимостей
install:
	@echo "Установка зависимостей фронтенда..."
	cd frontend-shell && npm install

# Запуск development сервера
dev:
	@echo "Запуск development сервера..."
	cd frontend-shell && npm run dev

# Сборка для продакшена
build:
	@echo "Сборка для продакшена..."
	cd frontend-shell && npm run build

# Просмотр production сборки
preview:
	@echo "Просмотр production сборки..."
	cd frontend-shell && npm run preview

# Тестирование
test:
	@echo "Запуск тестов..."
	cd frontend-shell && npm run test

# Тесты в watch режиме
test-watch:
	@echo "Тесты в watch режиме..."
	cd frontend-shell && npm run test:watch

# Покрытие тестами
test-coverage:
	@echo "Покрытие тестами..."
	cd frontend-shell && npm run test:coverage

# Проверка кода
lint:
	@echo "Проверка кода..."
	cd frontend-shell && npm run lint

# Исправление ошибок линтера
lint-fix:
	@echo "Исправление ошибок линтера..."
	cd frontend-shell && npm run lint:fix

# Проверка TypeScript
type-check:
	@echo "Проверка TypeScript..."
	cd frontend-shell && npm run type-check

# Анализ размера бандла
analyze:
	@echo "Анализ размера бандла..."
	cd frontend-shell && npm run analyze

# Очистка временных файлов
clean:
	@echo "Очистка временных файлов..."
	cd frontend-shell && rm -rf dist node_modules/.cache .turbo

# Полная очистка включая node_modules
clean-all: clean
	@echo "Полная очистка..."
	cd frontend-shell && rm -rf node_modules

# Обновление зависимостей
update:
	@echo "Обновление зависимостей..."
	cd frontend-shell && npm update

# Аудит безопасности
audit:
	@echo "Аудит безопасности..."
	cd frontend-shell && npm audit

# Исправление уязвимостей
audit-fix:
	@echo "Исправление уязвимостей..."
	cd frontend-shell && npm audit fix

# Форматирование кода
format:
	@echo "Форматирование кода..."
	cd frontend-shell && npx prettier --write .

# Docker команды
docker-build:
	@echo "Сборка Docker образа..."
	cd frontend-shell && docker build -t frontend-shell .

docker-run:
	@echo "Запуск в Docker..."
	docker run -p 3000:80 frontend-shell

# Установка новой зависимости
install-dep:
	@read -p "Введите название пакета: " package; \
	cd frontend-shell && npm install $$package

# Установка dev зависимости
install-dev-dep:
	@read -p "Введите название dev пакета: " package; \
	cd frontend-shell && npm install -D $$package

# Удаление зависимости
remove-dep:
	@read -p "Введите название пакета для удаления: " package; \
	cd frontend-shell && npm uninstall $$package

# Показать информацию о проекте
info:
	@echo "Информация о фронтенде:"
	@echo "- Технологии: React 18 + TypeScript + Vite"
	@echo "- Стили: TailwindCSS"
	@echo "- State: Zustand + React Query"
	@echo "- PWA: Vite PWA Plugin"
	@echo "- Dev сервер: http://localhost:3000"

# Quick start
quickstart: install dev
	@echo "🎨 Фронтенд запущен!"
	@echo "- Откройте: http://localhost:3000"
	@echo "- Тестовый вход: admin@gov.kz / test-signature-123"

# Полная установка и запуск
full-setup: clean-all install build
	@echo "✅ Фронтенд полностью настроен и собран!"

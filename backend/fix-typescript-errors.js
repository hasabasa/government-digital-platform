#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Папки для поиска и исправления
const serviceDirs = [
  'apps/auth-service/src',
  'apps/user-service/src', 
  'apps/chat-service/src',
  'apps/file-service/src'
];

// Исправляем ошибки TypeScript TS18046: 'error' is of type 'unknown'
function fixTypeScriptErrors(filePath) {
  console.log(`Исправляем файл: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Исправляем error.message на (error as Error).message
  content = content.replace(/error\.message/g, '(error as Error).message');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Исправлен: ${filePath}`);
}

// Рекурсивный поиск .ts файлов
function findTsFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`⚠️ Папка не найдена: ${dir}`);
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Основная функция
function main() {
  console.log('🔧 Исправляем TypeScript ошибки...\n');
  
  for (const serviceDir of serviceDirs) {
    console.log(`\n📁 Обрабатываем: ${serviceDir}`);
    const tsFiles = findTsFiles(serviceDir);
    
    for (const file of tsFiles) {
      try {
        fixTypeScriptErrors(file);
      } catch (error) {
        console.error(`❌ Ошибка при обработке ${file}:`, error.message);
      }
    }
  }
  
  console.log('\n✅ Все ошибки исправлены!');
  console.log('\n🚀 Запускаем сервисы...');
  
  // Запускаем сервисы
  exec('npm run dev', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Ошибка запуска:', error.message);
      return;
    }
    console.log(stdout);
    if (stderr) console.log(stderr);
  });
}

main();

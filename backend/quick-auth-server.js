#!/usr/bin/env node

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Вспомогательная функция для генерации ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Тестовые данные пользователей
const testUsers = [
  {
    id: '1',
    email: 'admin@gov.kz',
    firstName: 'Администратор',
    lastName: 'Системы',
    role: 'admin',
    iin: '123456789012',
    organization: 'Министерство цифрового развития',
    position: 'Системный администратор'
  },
  {
    id: '2', 
    email: 'moderator@gov.kz',
    firstName: 'Модератор',
    lastName: 'Платформы',
    role: 'moderator',
    iin: '234567890123',
    organization: 'Министерство цифрового развития',
    position: 'Модератор контента'
  },
  {
    id: '3',
    email: 'official@gov.kz',
    firstName: 'Иван',
    lastName: 'Иванов',
    role: 'government_official',
    iin: '345678901234',
    organization: 'Министерство внутренних дел',
    position: 'Начальник отдела'
  },
  {
    id: '4',
    email: 'head@gov.kz',
    firstName: 'Петр',
    lastName: 'Петров', 
    role: 'department_head',
    iin: '456789012345',
    organization: 'Министерство экономического развития',
    position: 'Заместитель министра'
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock login endpoint (старый метод для совместимости)
app.post('/api/v1/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  
  const { email, digitalSignature } = req.body;
  
  if (!email || !digitalSignature) {
    return res.status(400).json({
      success: false,
      error: 'Email и ЭЦП обязательны'
    });
  }
  
  // Проверяем тестовую ЭЦП
  if (digitalSignature !== 'test-signature-123') {
    return res.status(401).json({
      success: false,
      error: 'Неверная электронная цифровая подпись'
    });
  }
  
  // Ищем пользователя
  const user = testUsers.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Пользователь не найден'
    });
  }
  
  // Генерируем mock токены
  const accessToken = `mock-access-token-${user.id}-${Date.now()}`;
  const refreshToken = `mock-refresh-token-${user.id}-${Date.now()}`;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token: accessToken,
      refreshToken: refreshToken
    }
  });
});

// Mock ЭЦП login endpoint (новый метод)
app.post('/api/v1/auth/login-ecp', (req, res) => {
  console.log('ECP Login request received');
  console.log('Certificate data:', JSON.stringify(req.body.certificate, null, 2));
  console.log('Signature length:', req.body.signature?.length);
  
  const { certificate, signature, timestamp } = req.body;
  
  if (!certificate || !signature) {
    return res.status(400).json({
      success: false,
      error: 'Сертификат и подпись обязательны'
    });
  }
  
  // Логируем подробную информацию о сертификате
  console.log('Certificate details:');
  console.log('- Subject Name:', certificate.subjectName);
  console.log('- Issuer Name:', certificate.issuerName);
  console.log('- Serial Number:', certificate.serialNumber);
  console.log('- Valid From:', certificate.validFrom);
  console.log('- Valid To:', certificate.validTo);
  console.log('- IIN:', certificate.iin);
  console.log('- Full Name:', certificate.fullName);
  console.log('- Organization:', certificate.organization);
  console.log('- Position:', certificate.position);
  console.log('- Email:', certificate.email);
  
  // В реальной системе здесь была бы проверка подписи через НУЦ РК
  // Пока что просто логируем и принимаем любой валидный сертификат
  
  // Базовая валидация сертификата
  if (!certificate.subjectName && !certificate.fullName) {
    return res.status(401).json({
      success: false,
      error: 'Некорректный сертификат: отсутствует информация о владельце'
    });
  }
  
  // Проверяем срок действия сертификата
  if (certificate.validTo) {
    const validTo = new Date(certificate.validTo);
    if (validTo < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Срок действия сертификата истек'
      });
    }
  }
  
  // Извлекаем информацию о пользователе из сертификата
  const userInfo = {
    iin: certificate.iin || extractIINFromSubject(certificate.subjectName),
    fullName: certificate.fullName || extractNameFromSubject(certificate.subjectName),
    organization: certificate.organization || extractOrgFromSubject(certificate.subjectName),
    position: certificate.position || extractPositionFromSubject(certificate.subjectName),
    email: certificate.email || extractEmailFromSubject(certificate.subjectName)
  };
  
  console.log('Extracted user info:', userInfo);
  
  // Ищем пользователя по ИИН
  let user = testUsers.find(u => u.iin === userInfo.iin);
  
  // Если пользователь не найден, создаем нового на основе данных из сертификата
  if (!user) {
    const nameParts = userInfo.fullName?.split(' ') || [];
    user = {
      id: userInfo.iin || `user-${Date.now()}`,
      email: userInfo.email || `user_${userInfo.iin || Date.now()}@gov.kz`,
      firstName: nameParts[1] || 'Имя',
      lastName: nameParts[0] || 'Фамилия',
      role: determineUserRole(userInfo.organization, userInfo.position),
      iin: userInfo.iin,
      organization: userInfo.organization,
      position: userInfo.position
    };
    
    // Добавляем в список пользователей
    testUsers.push(user);
    console.log('Создан новый пользователь на основе ЭЦП:', user);
  } else {
    console.log('Найден существующий пользователь:', user);
  }
  
  // Генерируем токены
  const accessToken = `real-ecp-token-${user.id}-${Date.now()}`;
  const refreshToken = `real-ecp-refresh-${user.id}-${Date.now()}`;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        iin: user.iin,
        organization: user.organization,
        position: user.position
      },
      token: accessToken,
      refreshToken: refreshToken,
      certificateInfo: {
        serialNumber: certificate.serialNumber,
        validTo: certificate.validTo,
        issuer: certificate.issuerName,
        isRealECP: true
      }
    }
  });
});

// Вспомогательные функции для парсинга данных из сертификата
function extractIINFromSubject(subjectName = '') {
  const match = subjectName.match(/SERIALNUMBER=IIN(\d+)/i) || 
                subjectName.match(/IIN(\d+)/i) ||
                subjectName.match(/SERIALNUMBER=(\d+)/i);
  return match ? match[1] : null;
}

function extractNameFromSubject(subjectName = '') {
  const match = subjectName.match(/CN=([^,]+)/i);
  return match ? match[1].trim() : null;
}

function extractOrgFromSubject(subjectName = '') {
  const match = subjectName.match(/O=([^,]+)/i);
  return match ? match[1].trim() : null;
}

function extractPositionFromSubject(subjectName = '') {
  const match = subjectName.match(/T=([^,]+)/i);
  return match ? match[1].trim() : null;
}

function extractEmailFromSubject(subjectName = '') {
  const match = subjectName.match(/E=([^,]+)/i) || subjectName.match(/EMAILADDRESS=([^,]+)/i);
  return match ? match[1].trim() : null;
}

function determineUserRole(organization = '', position = '') {
  const orgLower = organization.toLowerCase();
  const posLower = position.toLowerCase();
  
  if (posLower.includes('министр') || posLower.includes('заместитель')) {
    return 'department_head';
  } else if (posLower.includes('администратор') || posLower.includes('системный')) {
    return 'admin';
  } else if (posLower.includes('модератор')) {
    return 'moderator';
  } else if (orgLower.includes('министерство') || orgLower.includes('комитет') || orgLower.includes('акимат')) {
    return 'government_official';
  } else {
    return 'user';
  }
}

// Mock user profile endpoint
app.get('/api/v1/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Требуется авторизация'
    });
  }
  
  // Извлекаем ID пользователя из токена
  const token = authHeader.split(' ')[1];
  const userIdMatch = token.match(/mock-access-token-(\d+)-/);
  if (!userIdMatch) {
    return res.status(401).json({
      success: false,
      error: 'Неверный токен'
    });
  }
  
  const userId = userIdMatch[1];
  const user = testUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Пользователь не найден'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Mock logout endpoint
app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Выход выполнен успешно'
  });
});

// Mock refresh token endpoint
app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken || !refreshToken.startsWith('mock-refresh-token-')) {
    return res.status(401).json({
      success: false,
      error: 'Неверный refresh token'
    });
  }
  
  // Извлекаем ID пользователя из refresh токена
  const userIdMatch = refreshToken.match(/mock-refresh-token-(\d+)-/);
  if (!userIdMatch) {
    return res.status(401).json({
      success: false,
      error: 'Неверный refresh token'
    });
  }
  
  const userId = userIdMatch[1];
  const newAccessToken = `mock-access-token-${userId}-${Date.now()}`;
  const newRefreshToken = `mock-refresh-token-${userId}-${Date.now()}`;
  
  res.json({
    success: true,
    data: {
      token: newAccessToken,
      refreshToken: newRefreshToken
    }
  });
});

// eGov Mobile аутентификация
const mobileSessions = new Map(); // Храним активные сессии

// Инициализация аутентификации через eGov Mobile
app.post('/api/v1/auth/egov-mobile/init', (req, res) => {
  console.log('📱 Инициализация eGov Mobile аутентификации');
  
  const sessionId = generateId();
  const qrData = `egov://auth?session=${sessionId}&server=${req.get('host')}&timestamp=${Date.now()}`;
  const deepLink = `egov://auth?data=${encodeURIComponent(qrData)}`;
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 минут
  
  const authRequest = {
    sessionId,
    qrData,
    deepLink,
    expiresAt,
    status: 'waiting', // waiting, completed, expired, cancelled
    userData: null
  };
  
  mobileSessions.set(sessionId, authRequest);
  
  console.log(`✅ Создана сессия eGov Mobile: ${sessionId}`);
  
  res.json({
    sessionId,
    qrData,
    deepLink,
    expiresAt
  });
});

// Проверка статуса аутентификации
app.get('/api/v1/auth/egov-mobile/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = mobileSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Сессия не найдена'
    });
  }
  
  // Проверяем истечение времени
  if (Date.now() > session.expiresAt) {
    session.status = 'expired';
    mobileSessions.delete(sessionId);
    return res.json({
      success: false,
      error: 'Время ожидания истекло'
    });
  }
  
  if (session.status === 'completed') {
    // Возвращаем данные пользователя
    mobileSessions.delete(sessionId);
    return res.json({
      success: true,
      userData: session.userData
    });
  }
  
  // Еще ожидаем
  res.json({
    success: false,
    status: session.status
  });
});

// Симуляция подтверждения от мобильного приложения (для тестирования)
app.post('/api/v1/auth/egov-mobile/confirm/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = mobileSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Сессия не найдена'
    });
  }
  
  if (Date.now() > session.expiresAt) {
    mobileSessions.delete(sessionId);
    return res.status(400).json({
      success: false,
      error: 'Сессия истекла'
    });
  }
  
  // Симулируем данные пользователя от eGov Mobile
  const userData = {
    iin: '123456789012',
    fullName: 'Тестовый Пользователь eGov',
    firstName: 'Тестовый',
    lastName: 'Пользователь',
    middleName: 'eGov',
    email: 'egov.user@test.kz',
    organization: 'Министерство цифрового развития',
    position: 'Тестовый пользователь eGov Mobile',
    avatar: null
  };
  
  session.status = 'completed';
  session.userData = userData;
  
  console.log(`✅ eGov Mobile аутентификация подтверждена для сессии: ${sessionId}`);
  
  res.json({
    success: true,
    message: 'Аутентификация подтверждена'
  });
});

// Отмена аутентификации
app.post('/api/v1/auth/egov-mobile/cancel/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = mobileSessions.get(sessionId);
  
  if (session) {
    session.status = 'cancelled';
    mobileSessions.delete(sessionId);
    console.log(`🚫 eGov Mobile сессия отменена: ${sessionId}`);
  }
  
  res.json({
    success: true,
    message: 'Сессия отменена'
  });
});

// Вход через eGov Mobile (после успешной аутентификации)
app.post('/api/v1/auth/login-egov-mobile', (req, res) => {
  console.log('📱 eGov Mobile Login request received');
  const userData = req.body;
  
  console.log('📋 eGov Mobile User data:', userData);
  
  // Ищем или создаем пользователя
  let user = testUsers.find(u => u.iin === userData.iin);
  
  if (!user) {
    // Создаем нового пользователя на основе данных от eGov Mobile
    user = {
      id: generateId(),
      iin: userData.iin,
      email: userData.email || `${userData.iin}@egov.mobile`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      middleName: userData.middleName,
      role: determineUserRole(userData.organization, userData.position),
      status: 'active',
      position: userData.position || 'Пользователь eGov Mobile',
      department: 'eGov Mobile',
      organization: userData.organization || 'eGov Mobile',
      digitalCertificate: `egov-mobile-${userData.iin}`,
      isOnline: true,
      avatar: userData.avatar,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    testUsers.push(user);
    console.log('✅ Создан новый пользователь eGov Mobile:', user.email);
  } else {
    // Обновляем существующего пользователя
    user.isOnline = true;
    user.lastLoginAt = new Date().toISOString();
    if (userData.avatar) user.avatar = userData.avatar;
    console.log('✅ Обновлен существующий пользователь eGov Mobile:', user.email);
  }
  
  // Генерируем токены
  const accessToken = `mock-access-token-${user.id}-${Date.now()}`;
  const refreshToken = `mock-refresh-token-${user.id}-${Date.now()}`;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        iin: user.iin,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        fullName: `${user.firstName} ${user.lastName}${user.middleName ? ` ${user.middleName}` : ''}`,
        role: user.role,
        position: user.position,
        department: user.department,
        organization: user.organization,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastLoginAt: user.lastLoginAt
      },
      token: accessToken,
      refreshToken: refreshToken
    },
    message: 'eGov Mobile аутентификация успешна'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Mock Auth Server запущен на http://localhost:${PORT}`);
  console.log('📋 Доступные endpoints:');
  console.log('  GET  /health - проверка состояния');
  console.log('  POST /api/v1/auth/login - авторизация');
  console.log('  POST /api/v1/auth/login-ecp - вход по ЭЦП');
  console.log('  POST /api/v1/auth/login-egov-mobile - вход через eGov Mobile');
  console.log('  POST /api/v1/auth/egov-mobile/init - создание QR сессии');
  console.log('  GET  /api/v1/auth/egov-mobile/status/:id - статус сессии');
  console.log('  POST /api/v1/auth/egov-mobile/confirm/:id - подтверждение (тест)');
  console.log('  POST /api/v1/auth/egov-mobile/cancel/:id - отмена сессии');
  console.log('  GET  /api/v1/auth/me - профиль пользователя');
  console.log('  POST /api/v1/auth/logout - выход');
  console.log('  POST /api/v1/auth/refresh - обновление токена');
  console.log('');
  console.log('🔐 Тестовые данные для входа:');
  testUsers.forEach(user => {
    console.log(`  📧 ${user.email} (${user.role})`);
  });
  console.log('  🔑 ЭЦП: test-signature-123');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n👋 Сервер остановлен');
  process.exit(0);
});

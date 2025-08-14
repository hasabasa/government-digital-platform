/**
 * Mock сертификаты для тестирования без NCALayer
 */

import { Certificate } from './ncalayer.service';

export const mockCertificates: Certificate[] = [
  {
    id: 'mock-cert-1',
    subjectName: 'CN=Системы Администратор,SERIALNUMBER=IIN123456789012,O=Министерство цифрового развития,T=Системный администратор,E=admin@gov.kz',
    issuerName: 'CN=НУЦ РК TEST CA,O=Национальный удостоверяющий центр РК',
    serialNumber: '01234567890ABCDEF',
    validFrom: '2024-01-01T00:00:00Z',
    validTo: '2025-12-31T23:59:59Z',
    keyUsage: ['digital_signature', 'non_repudiation'],
    iin: '123456789012',
    fullName: 'Системы Администратор',
    organization: 'Министерство цифрового развития',
    position: 'Системный администратор',
    email: 'admin@gov.kz'
  },
  {
    id: 'mock-cert-2',
    subjectName: 'CN=Платформы Модератор,SERIALNUMBER=IIN234567890123,O=Министерство цифрового развития,T=Модератор контента,E=moderator@gov.kz',
    issuerName: 'CN=НУЦ РК TEST CA,O=Национальный удостоверяющий центр РК',
    serialNumber: '02345678901BCDEFG',
    validFrom: '2024-01-01T00:00:00Z',
    validTo: '2025-12-31T23:59:59Z',
    keyUsage: ['digital_signature', 'non_repudiation'],
    iin: '234567890123',
    fullName: 'Платформы Модератор',
    organization: 'Министерство цифрового развития',
    position: 'Модератор контента',
    email: 'moderator@gov.kz'
  },
  {
    id: 'mock-cert-3',
    subjectName: 'CN=Иванов Иван Иванович,SERIALNUMBER=IIN345678901234,O=Министерство внутренних дел,T=Начальник отдела,E=official@gov.kz',
    issuerName: 'CN=НУЦ РК TEST CA,O=Национальный удостоверяющий центр РК',
    serialNumber: '03456789012CDEFGH',
    validFrom: '2024-01-01T00:00:00Z',
    validTo: '2025-12-31T23:59:59Z',
    keyUsage: ['digital_signature', 'non_repudiation'],
    iin: '345678901234',
    fullName: 'Иванов Иван Иванович',
    organization: 'Министерство внутренних дел',
    position: 'Начальник отдела',
    email: 'official@gov.kz'
  },
  {
    id: 'mock-cert-4',
    subjectName: 'CN=Петров Петр Петрович,SERIALNUMBER=IIN456789012345,O=Министерство экономического развития,T=Заместитель министра,E=head@gov.kz',
    issuerName: 'CN=НУЦ РК TEST CA,O=Национальный удостоверяющий центр РК',
    serialNumber: '04567890123DEFGHI',
    validFrom: '2024-01-01T00:00:00Z',
    validTo: '2025-12-31T23:59:59Z',
    keyUsage: ['digital_signature', 'non_repudiation'],
    iin: '456789012345',
    fullName: 'Петров Петр Петрович',
    organization: 'Министерство экономического развития',
    position: 'Заместитель министра',
    email: 'head@gov.kz'
  },
  {
    id: 'mock-cert-expired',
    subjectName: 'CN=Просроченный Сертификат,SERIALNUMBER=IIN999999999999,O=Тест Организация,T=Тест Должность',
    issuerName: 'CN=НУЦ РК TEST CA,O=Национальный удостоверяющий центр РК',
    serialNumber: 'EXPIRED123456789',
    validFrom: '2023-01-01T00:00:00Z',
    validTo: '2023-12-31T23:59:59Z', // Просроченный сертификат
    keyUsage: ['digital_signature', 'non_repudiation'],
    iin: '999999999999',
    fullName: 'Просроченный Сертификат',
    organization: 'Тест Организация',
    position: 'Тест Должность',
    email: 'expired@test.kz'
  }
];

/**
 * Создает mock подпись для тестирования
 */
export function createMockSignature(certificateId: string, data: string): string {
  // В реальности здесь была бы криптографическая подпись
  const timestamp = Date.now();
  const mockSignature = `MOCK-SIGNATURE-${certificateId}-${timestamp}`;
  
  // Кодируем в base64 для имитации реальной подписи
  return btoa(mockSignature);
}

/**
 * Проверяет, включен ли mock режим (для разработки)
 */
export function isMockMode(): boolean {
  // Принудительно отключаем mock режим для тестирования с реальной ЭЦП
  if (window.location.search.includes('real-ecp=true')) {
    return false;
  }
  
  // Включаем mock только если явно указано
  return window.location.search.includes('mock=true');
}

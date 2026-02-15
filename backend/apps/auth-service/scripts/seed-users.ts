/**
 * Seed script — создаёт 4 аккаунта в БД
 * Запуск: npx tsx scripts/seed-users.ts
 */
import { DatabaseConnection } from '../src/database/connection';
import { users } from '@gov-platform/database';
import { CryptoUtils } from '../src/utils/crypto';

const USERS = [
    {
        email: 'Hasenhankazimov@gmail.com',
        password: 'cube2025',
        firstName: 'Хасенхан',
        lastName: 'Казимов',
        role: 'admin' as const,
        position: 'Управляющий партнёр',
    },
    {
        email: 'hamitov.adil04@gmail.com',
        password: 'cube2025',
        firstName: 'Адиль',
        lastName: 'Хамитов',
        role: 'admin' as const,
        position: 'Партнёр',
    },
    {
        email: 'azamatbekkhaliev@gmail.com',
        password: 'cube2025',
        firstName: 'Азамат',
        lastName: 'Бекхалиев',
        role: 'admin' as const,
        position: 'Партнёр',
    },
    {
        email: 'makazanalpamys@gmail.com',
        password: 'cube2025',
        firstName: 'Алпамыс',
        lastName: 'Мақажан',
        role: 'employee' as const,
        position: 'Разработчик',
    },
];

async function seed() {
    const db = DatabaseConnection.getInstance().getDatabase();

    for (const u of USERS) {
        const passwordHash = await CryptoUtils.hashPassword(u.password);

        try {
            await db.insert(users).values({
                email: u.email,
                passwordHash,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                position: u.position,
                status: 'active',
            });
            console.log(`✅ ${u.firstName} ${u.lastName} (${u.email}) — ${u.role}`);
        } catch (err: any) {
            if (err.message?.includes('duplicate') || err.code === '23505') {
                console.log(`⏩ ${u.email} уже существует, пропускаю`);
            } else {
                console.error(`❌ Ошибка для ${u.email}:`, err.message);
            }
        }
    }

    console.log('\n🎉 Seed завершён!');
    process.exit(0);
}

seed();

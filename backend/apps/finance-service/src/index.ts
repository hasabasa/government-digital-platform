import { FinanceApp } from './app';

async function main() {
    const financeApp = new FinanceApp();
    await financeApp.start();
}

main().catch((error) => {
    console.error('Failed to start finance service:', error);
    process.exit(1);
});

import { CrmApp } from './app';

async function main() {
    const crmApp = new CrmApp();
    await crmApp.start();
}

main().catch((error) => {
    console.error('Failed to start CRM service:', error);
    process.exit(1);
});

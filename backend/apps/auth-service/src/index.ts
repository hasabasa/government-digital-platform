import { AuthApp } from './app';

async function main() {
  const authApp = new AuthApp();
  await authApp.start();
}

main().catch((error) => {
  console.error('Failed to start auth service:', error);
  process.exit(1);
});

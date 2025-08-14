import { UserApp } from './app';

async function main() {
  const userApp = new UserApp();
  await userApp.start();
}

main().catch((error) => {
  console.error('Failed to start user service:', error);
  process.exit(1);
});

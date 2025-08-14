import { ChatApp } from './app';

async function main() {
  const chatApp = new ChatApp();
  await chatApp.start();
}

main().catch((error) => {
  console.error('Failed to start chat service:', error);
  process.exit(1);
});

import { FileApp } from './app';

async function main() {
  const fileApp = new FileApp();
  await fileApp.start();
}

main().catch((error) => {
  console.error('Failed to start file service:', error);
  process.exit(1);
});

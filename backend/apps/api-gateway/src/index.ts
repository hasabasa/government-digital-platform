import { APIGateway } from './app';

async function main() {
  const gateway = new APIGateway();
  await gateway.start();
}

main().catch((error) => {
  console.error('Failed to start API gateway:', error);
  process.exit(1);
});

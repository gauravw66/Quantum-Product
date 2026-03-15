const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.quantumAccount.findMany({
    where: { userId: 'd972afe3-ef4b-49e6-89b4-404c9b11d442' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(accounts.map(a => ({
    id: a.id,
    token: a.token.substring(0, 10) + '...',
    createdAt: a.createdAt
  })), null, 2));
}

main().finally(() => prisma.$disconnect());

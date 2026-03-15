const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const account = await prisma.quantumAccount.findFirst();
    if (account) {
      console.log('Account found:');
      console.log('Provider:', account.provider);
      console.log('Token (first 10 chars):', account.token.substring(0, 10) + '...');
      console.log('UserId:', account.userId);
    } else {
      console.log('No quantum account found in DB');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

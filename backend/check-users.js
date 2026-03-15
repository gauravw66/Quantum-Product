const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log(`There are ${userCount} users in the database.`);
  } catch (err) {
    console.error('Error checking users:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

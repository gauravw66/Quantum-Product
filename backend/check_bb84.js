const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const modules = await prisma.module.findMany({
        where: { name: { contains: 'BB84', mode: 'insensitive' } }
    });
    console.log(JSON.stringify(modules, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

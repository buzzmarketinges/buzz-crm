
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users found:', users.map(u => ({ email: u.email, name: u.name })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

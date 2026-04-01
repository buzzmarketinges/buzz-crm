
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('buzz1234', 10)
  const user = await prisma.user.upsert({
    where: { email: 'info@buzzmarketing.es' },
    update: { password: hashedPassword },
    create: {
      name: 'Buzz Admin',
      email: 'info@buzzmarketing.es',
      password: hashedPassword
    }
  })
  console.log('User password updated to buzz1234 for:', user.email)
}

main().catch(console.error).finally(() => prisma.$disconnect())

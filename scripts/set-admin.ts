
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'sgarcia@novamarketing.es'
  const password = 'Valerossi#7n'
  const name = 'Sergio Garcia'

  const hashedPassword = await bcrypt.hash(password, 10)
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      password: hashedPassword,
      name
    },
    create: {
      email,
      password: hashedPassword,
      name
    }
  })
  
  console.log('✅ Usuario actualizado/creado exitosamente:')
  console.log('   Email:', user.email)
  console.log('   Nombre:', user.name)
}

main()
  .catch((e) => {
    console.error('❌ Error al actualizar el usuario:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

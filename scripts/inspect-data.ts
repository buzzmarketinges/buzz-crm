
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const companies = await prisma.company.findMany()
    console.log('Total Companies:', companies.length)
    if (companies.length > 0) {
        console.log('Sample Company:', companies[0])
    }

    const settings = await prisma.settings.findMany()
    console.log('Settings:', settings)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

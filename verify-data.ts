
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.company.count()
    console.log(`Total companies in DB: ${count}`)

    if (count > 0) {
        const clients = await prisma.company.findMany({
            select: { name: true, businessName: true, taxId: true }
        })
        console.table(clients)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

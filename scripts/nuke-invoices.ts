
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️ Deleting all invoices...')
    const result = await prisma.invoice.deleteMany({})
    console.log(`✅ Deleted ${result.count} invoices.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

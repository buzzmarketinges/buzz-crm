import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Deleting all invoices...')
    try {
        const deleted = await prisma.invoice.deleteMany({})
        console.log(`Deleted ${deleted.count} invoices.`)
    } catch (error) {
        console.error('Error deleting invoices:', error)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

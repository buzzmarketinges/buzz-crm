import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const companyCount = await prisma.company.count()
    const invoiceCount = await prisma.invoice.count()
    const serviceCount = await prisma.service.count()

    console.log(`Companies: ${companyCount}`)
    console.log(`Invoices: ${invoiceCount}`)
    console.log(`Services: ${serviceCount}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tenants = await prisma.settings.findMany({
        select: { id: true, companyName: true }
    })
    console.log("TENANTS:", JSON.stringify(tenants, null, 2))

    const invoices = await prisma.invoice.findMany({
        select: { number: true, settingsId: true },
        take: 20
    })
    console.log("INVOICES (First 20):", JSON.stringify(invoices, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

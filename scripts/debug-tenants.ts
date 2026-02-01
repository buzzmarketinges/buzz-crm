
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("--- TENANTS (Settings) ---")
    const tenants = await prisma.settings.findMany({
        select: { id: true, companyName: true, isAdminMode: true }
    })
    console.table(tenants)

    console.log("\n--- INVOICES ---")
    const invoices = await prisma.invoice.findMany({
        take: 50,
        select: { id: true, number: true, settingsId: true }
    })
    console.table(invoices)

    console.log("\n--- COMPANIES ---")
    const companies = await prisma.company.findMany({
        select: { id: true, name: true, settingsId: true }
    })
    console.table(companies)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

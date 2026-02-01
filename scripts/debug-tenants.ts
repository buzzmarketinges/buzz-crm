
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("--- TENANTS (Settings) ---")
    const tenants = await prisma.settings.queryRaw`SELECT id, companyName, isAdminMode FROM Settings`
    console.table(tenants)

    console.log("\n--- INVOICES ---")
    const invoices = await prisma.invoice.queryRaw`SELECT id, number, settingsId FROM Invoice LIMIT 50`
    console.table(invoices)

    console.log("\n--- COMPANIES ---")
    const companies = await prisma.company.queryRaw`SELECT id, name, settingsId FROM Company`
    console.table(companies)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

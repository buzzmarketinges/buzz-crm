
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tenants = await prisma.settings.findMany()
    console.log("TENANTS FOUND:", tenants.length)
    tenants.forEach(t => console.log(`- [${t.id}] ${t.companyName}`))

    const invoices = await prisma.invoice.findMany({ include: { company: true } })
    console.log("\nINVOICES CHECK:")
    invoices.forEach(inv => {
        if (inv.settingsId !== inv.company.settingsId) {
            console.log(`MISMATCH! Invoice ${inv.number} has settingsId=${inv.settingsId} but Company belongs to ${inv.company.settingsId}`)
        }
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

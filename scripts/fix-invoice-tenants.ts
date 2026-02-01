
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Fixing Invoice settingsIds...")
    const invoices = await prisma.invoice.findMany({ include: { company: true } })

    let fixedCount = 0;
    for (const inv of invoices) {
        if (inv.settingsId !== inv.company.settingsId) {
            console.log(`Fixing Invoice ${inv.number}: ${inv.settingsId} -> ${inv.company.settingsId}`)
            await prisma.invoice.update({
                where: { id: inv.id },
                data: { settingsId: inv.company.settingsId }
            })
            fixedCount++
        }
    }
    console.log(`Fixed ${fixedCount} invoices.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

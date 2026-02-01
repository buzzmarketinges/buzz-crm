
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Creating 'BuzzMarketing ES' tenant...")

    // Check if it already exists to avoid duplicates (though I deleted it earlier)
    const existing = await prisma.settings.findFirst({
        where: { companyName: 'BuzzMarketing ES' }
    })

    if (existing) {
        console.log("Tenant 'BuzzMarketing ES' already exists (ID: " + existing.id + ").")
        // Ensuring it is empty of data would be a separate step, but based on previous turns, we know it was deleted.
        // If it was just re-created, it's empty.
        return
    }

    const newTenant = await prisma.settings.create({
        data: {
            companyName: "BuzzMarketing ES",
            companyAddress: "Calle Nueva, 123, Madrid, España", // Placeholder
            companyEmail: "hola@buzzmarketing.es",
            companyTaxId: "ES-B12345678",
            invoicePrefix: "ES-",
            yearlyGoal: 50000,

            // Optional: Set a simulated date or leave null
            simulatedDate: null
        }
    })

    console.log(`Created new tenant: ${newTenant.companyName}`)
    console.log(`ID: ${newTenant.id}`)
    console.log("This tenant has no clients, services, or invoices.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Starting cleanup of 'BuzzMarketing ES' data...")

    // 1. Search for 'BuzzMarketing ES' as a TENANT (Settings)
    const tenantToDelete = await prisma.settings.findFirst({
        where: {
            companyName: 'BuzzMarketing ES'
        }
    })

    if (tenantToDelete) {
        console.log(`Found TENANT 'BuzzMarketing ES' (ID: ${tenantToDelete.id}). Deleting...`)

        // Delete related data first because onDelete: Cascade is likely missing on Settings relations
        console.log("  - Deleting Company records...")
        await prisma.company.deleteMany({ where: { settingsId: tenantToDelete.id } })

        console.log("  - Deleting Service records...")
        await prisma.service.deleteMany({ where: { settingsId: tenantToDelete.id } })

        console.log("  - Deleting ServiceTemplate records...")
        await prisma.serviceTemplate.deleteMany({ where: { settingsId: tenantToDelete.id } })

        console.log("  - Deleting Invoice records...")
        await prisma.invoice.deleteMany({ where: { settingsId: tenantToDelete.id } })

        console.log("  - Deleting the Settings (Tenant) record itself...")
        await prisma.settings.delete({
            where: { id: tenantToDelete.id }
        })
        console.log("TENANT 'BuzzMarketing ES' deleted successfully.")
    } else {
        console.log("No TENANT found with name 'BuzzMarketing ES'.")
    }

    // 2. Search for 'BuzzMarketing ES' as a CLIENT (Company)
    const companiesToDelete = await prisma.company.findMany({
        where: {
            OR: [
                { name: { contains: 'BuzzMarketing ES' } },
                { businessName: { contains: 'BuzzMarketing ES' } }
            ]
        }
    })

    if (companiesToDelete.length > 0) {
        console.log(`Found ${companiesToDelete.length} CLIENT(S) matching 'BuzzMarketing ES'. Deleting...`)
        for (const company of companiesToDelete) {
            console.log(`  - Deleting Company: ${company.name} (ID: ${company.id})`)
            // Prisma schema has onDelete: Cascade for Company relations (Contacts, Services, Invoices)
            await prisma.company.delete({
                where: { id: company.id }
            })
        }
        console.log("CLIENTS deleted successfully.")
    } else {
        console.log("No CLIENTS found matching 'BuzzMarketing ES'.")
    }

    console.log("Cleanup finished.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Check/Create BuzzMarketing LLC
    let llc = await prisma.settings.findFirst({
        where: { companyName: "BuzzMarketing LLC" }
    })

    if (!llc) {
        console.log("Creating BuzzMarketing LLC settings...")
        llc = await prisma.settings.create({
            data: {
                companyName: "BuzzMarketing LLC",
                // Add other default fields if needed
                invoicePrefix: "INV-",
                invoiceNextNumber: 1,
                yearlyGoal: 100000,
                localSavePath: "C:/Facturas"
            }
        })
        console.log("Created BuzzMarketing LLC with ID:", llc.id)
    } else {
        console.log("BuzzMarketing LLC already exists:", llc.id)
    }

    // 2. Check/Create BuzzMarketing ES
    let es = await prisma.settings.findFirst({
        where: { companyName: "BuzzMarketing ES" }
    })

    if (!es) {
        console.log("Creating BuzzMarketing ES settings...")
        es = await prisma.settings.create({
            data: {
                companyName: "BuzzMarketing ES",
                invoicePrefix: "ES-",
                invoiceNextNumber: 1,
                yearlyGoal: 100000,
                localSavePath: "C:/Facturas/ES"
            }
        })
        console.log("Created BuzzMarketing ES with ID:", es.id)
    } else {
        console.log("BuzzMarketing ES already exists:", es.id)
    }

    // 3. Link orphaned data to LLC
    // We assume any data not linked to ES (and not linked to a valid LLC) should belong to LLC.
    // First, get all valid settings IDs
    const validSettingsIds = [llc.id, es.id]

    // Update Companies
    const orphanedCompanies = await prisma.company.updateMany({
        where: {
            NOT: { settingsId: { in: validSettingsIds } }
        },
        data: { settingsId: llc.id }
    })
    console.log(`Updated ${orphanedCompanies.count} orphaned companies to LLC`)

    // Update Invoices
    const orphanedInvoices = await prisma.invoice.updateMany({
        where: {
            NOT: { settingsId: { in: validSettingsIds } }
        },
        data: { settingsId: llc.id }
    })
    console.log(`Updated ${orphanedInvoices.count} orphaned invoices to LLC`)

    // Update Services
    const orphanedServices = await prisma.service.updateMany({
        where: {
            NOT: { settingsId: { in: validSettingsIds } }
        },
        data: { settingsId: llc.id }
    })
    console.log(`Updated ${orphanedServices.count} orphaned services to LLC`)

    // Update ServiceTemplates
    const orphanedTemplates = await prisma.serviceTemplate.updateMany({
        where: {
            NOT: { settingsId: { in: validSettingsIds } }
        },
        data: { settingsId: llc.id }
    })
    console.log(`Updated ${orphanedTemplates.count} orphaned service templates to LLC`)

}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

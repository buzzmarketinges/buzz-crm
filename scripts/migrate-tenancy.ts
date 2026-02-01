
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting multi-tenancy migration...')

    // 1. Ensure "BuzzMarketing LLC" exists (Existing data owner)
    let llcSettings = await prisma.settings.findFirst({
        where: { companyName: 'BuzzMarketing LLC' }
    })

    if (!llcSettings) {
        // Check if there is ANY settings record, assume it's the legacy one and rename/use it
        const existing = await prisma.settings.findFirst()
        if (existing) {
            console.log('Found existing settings, updating to BuzzMarketing LLC...')
            llcSettings = await prisma.settings.update({
                where: { id: existing.id },
                data: { companyName: 'BuzzMarketing LLC' }
            })
        } else {
            console.log('Creating BuzzMarketing LLC settings...')
            llcSettings = await prisma.settings.create({
                data: {
                    companyName: 'BuzzMarketing LLC',
                    invoicePrefix: 'INV-LLC-',
                    localSavePath: 'C:/Facturas/LLC'
                }
            })
        }
    }

    // 2. Ensure "BuzzMarketing ES" exists (New empty space)
    let esSettings = await prisma.settings.findFirst({
        where: { companyName: 'BuzzMarketing ES' }
    })

    // We look for entities where settingsId is 'default' (the default value we added in schema)
    // OR null if we hadn't added a default (but we did).

    const updateEntities = async (model: any, name: string) => {
        const result = await model.updateMany({
            where: { settingsId: 'default' },
            data: { settingsId: llcSettings!.id }
        })
        console.log(`Updated ${result.count} ${name} to LLC.`)
    }

    await updateEntities(prisma.company, 'Companies')
    await updateEntities(prisma.service, 'Services')
    await updateEntities(prisma.serviceTemplate, 'ServiceTemplates')
    await updateEntities(prisma.invoice, 'Invoices')

    console.log('Migration complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

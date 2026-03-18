
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding production database...')

    // 1. BuzzMarketing LLC
    const llc = await prisma.settings.create({
        data: {
            companyName: 'BuzzMarketing LLC',
            commercialName: 'BuzzMarketing',
            companyAddress: '123 Tech Street, Miami, FL, USA',
            companyTaxId: 'US-123456789',
            taxIdLabel: 'EIN',
            invoicePrefix: 'INV-LLC-',
            localSavePath: 'C:/Facturas/LLC',
            isAdminMode: true,
            taxEnabled: false,
            withholdingEnabled: false
        }
    })
    console.log('Created:', llc.companyName)

    // 2. BuzzMarketing ES
    const es = await prisma.settings.create({
        data: {
            companyName: 'BuzzMarketing ES',
            commercialName: 'BuzzMarketing España',
            companyAddress: 'Calle Tecnológica 123, Madrid, España',
            companyTaxId: 'B-12345678',
            taxIdLabel: 'NIF',
            invoicePrefix: 'INV-ES-',
            localSavePath: 'C:/Facturas/ES',
            isAdminMode: false, // Or true if preferred
            taxEnabled: true,
            taxRate: 21,
            withholdingEnabled: true,
            withholdingRate: 15
        }
    })
    console.log('Created:', es.companyName)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

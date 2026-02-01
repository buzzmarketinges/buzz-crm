
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing companies...')

    // 1. Get all settings
    const allSettings = await prisma.settings.findMany()
    console.log('Found:', allSettings.map(s => `${s.companyName} (${s.id})`))

    let llc = allSettings.find(s => s.companyName === 'BuzzMarketing LLC')
    let es = allSettings.find(s => s.companyName === 'BuzzMarketing ES')
    const others = allSettings.filter(s => s.companyName !== 'BuzzMarketing LLC' && s.companyName !== 'BuzzMarketing ES')

    // 2. Ensure LLC exists
    if (!llc) {
        console.log('Creating BuzzMarketing LLC...')
        llc = await prisma.settings.create({
            data: {
                companyName: 'BuzzMarketing LLC',
                invoicePrefix: 'INV-LLC-',
                localSavePath: 'C:/Facturas/LLC'
            }
        })
    }

    // 3. Ensure ES exists
    if (!es) {
        console.log('Creating BuzzMarketing ES...')
        es = await prisma.settings.create({
            data: {
                companyName: 'BuzzMarketing ES',
                invoicePrefix: 'INV-ES-',
                localSavePath: 'C:/Facturas/ES'
            }
        })
    }

    // 4. Move data from "others" (and 'default') to LLC
    // First, handle 'default' (rows that might not be linked to any valid settings yet)
    const models = [
        { name: 'Company', model: prisma.company },
        { name: 'Service', model: prisma.service },
        { name: 'ServiceTemplate', model: prisma.serviceTemplate },
        { name: 'Invoice', model: prisma.invoice },
    ]

    for (const { name, model } of models) {
        // Move 'default'
        const resDefault = await model.updateMany({
            where: { settingsId: 'default' },
            data: { settingsId: llc.id }
        })
        console.log(`Moved ${resDefault.count} ${name} from 'default' to LLC`)

        // Move from 'others'
        for (const other of others) {
            const resOther = await model.updateMany({
                where: { settingsId: other.id },
                data: { settingsId: llc.id }
            })
            console.log(`Moved ${resOther.count} ${name} from '${other.companyName}' to LLC`)
        }
    }

    // 5. Delete "others"
    for (const other of others) {
        console.log(`Deleting ${other.companyName}...`)
        await prisma.settings.delete({ where: { id: other.id } })
    }

    console.log('Fix complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

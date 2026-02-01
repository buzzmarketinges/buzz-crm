
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const settings = await prisma.settings.findMany({
        select: { id: true, companyName: true }
    })
    fs.writeFileSync('settings-list.json', JSON.stringify(settings, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

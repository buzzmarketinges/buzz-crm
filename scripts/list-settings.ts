
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const settings = await prisma.settings.findMany({
        select: { id: true, companyName: true }
    })
    console.log(JSON.stringify(settings, null, 2))

    const companies = await prisma.company.findMany({
        take: 1,
        select: { id: true, settingsId: true }
    })
    console.log('Sample Company SettingsID:', companies[0]?.settingsId)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

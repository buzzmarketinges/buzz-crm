
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Fixing Service settingsIds...")
    const services = await prisma.service.findMany({ include: { company: true } })

    let fixedCount = 0;
    for (const s of services) {
        if (s.settingsId !== s.company.settingsId) {
            console.log(`Fixing Service ${s.name}: ${s.settingsId} -> ${s.company.settingsId}`)
            await prisma.service.update({
                where: { id: s.id },
                data: { settingsId: s.company.settingsId }
            })
            fixedCount++
        }
    }
    console.log(`Fixed ${fixedCount} services.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

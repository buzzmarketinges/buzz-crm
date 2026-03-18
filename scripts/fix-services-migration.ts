
import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'
import path from 'path'

const prisma = new PrismaClient()
const sqlite = new Database(path.join(process.cwd(), 'prisma/dev.db'))

async function main() {
    console.log('Re-migrating Services with correct field mapping...')

    try {
        const services = sqlite.prepare('SELECT * FROM Service').all() as any[]
        console.log(`Found ${services.length} services`)

        for (const s of services) {
            const isActive = s.isActive === 1 || s.isActive === 'true' || s.isActive === true;

            // Convert timestamps to Date objects
            const lastBilledAt = s.lastBilledAt ? new Date(s.lastBilledAt) : null;
            const startDate = s.startDate ? new Date(s.startDate) : new Date();
            const endDate = s.endDate ? new Date(s.endDate) : null;

            await prisma.service.upsert({
                where: { id: s.id },
                update: {
                    name: s.name, // Use the actual name field
                    description: s.description,
                    price: s.price,
                    discount: s.discount || 0,
                    type: s.type, // Already correct in SQLite (RECURRENTE/PUNTUAL)
                    isActive: isActive,
                    lastBilledAt: lastBilledAt,
                    startDate: startDate,
                    endDate: endDate,
                    companyId: s.companyId,
                    serviceTemplateId: s.serviceTemplateId,
                    settingsId: s.settingsId || 'default'
                },
                create: {
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    price: s.price,
                    discount: s.discount || 0,
                    type: s.type,
                    isActive: isActive,
                    lastBilledAt: lastBilledAt,
                    startDate: startDate,
                    endDate: endDate,
                    companyId: s.companyId,
                    serviceTemplateId: s.serviceTemplateId,
                    settingsId: s.settingsId || 'default'
                }
            })
        }
        console.log('Services re-migrated successfully!')
    } catch (e) {
        console.error('Error re-migrating services:', e)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        sqlite.close()
    })

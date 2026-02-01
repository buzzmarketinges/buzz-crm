import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG BILLING ---')
    const settings = await prisma.settings.findFirst()
    const now = settings?.simulatedDate ? new Date(settings.simulatedDate) : new Date()
    console.log('Current "Now" Date:', now.toISOString())

    const services = await prisma.service.findMany({
        where: { isActive: true },
        include: { company: true }
    })

    console.log(`Found ${services.length} active services.`)

    for (const s of services) {
        const start = s.startDate ? new Date(s.startDate) : null
        const end = s.endDate ? new Date(s.endDate) : null

        console.log(`Service: ${s.name} (${s.type}) [${s.company.name}]`)
        console.log(`  StartDate: ${start?.toISOString()} | ${start && start > now ? 'FUTURE' : 'ACTIVE'}`)
        if (end) console.log(`  EndDate:   ${end.toISOString()}   | ${end < now ? 'EXPIRED' : 'ACTIVE'}`)
        console.log(`  LastBilled: ${s.lastBilledAt?.toISOString() || 'NEVER'}`)

        let isPending = false
        if (start && start > now) {
            console.log('  -> SKIPPED (Future Start)')
            continue
        }
        if (end && end < now) {
            console.log('  -> SKIPPED (Expired)')
            continue
        }

        if (s.type === 'PUNTUAL') {
            if (!s.lastBilledAt) {
                isPending = true
                console.log('  -> PENDING (Puntual, never billed)')
            } else {
                console.log('  -> SKIPPED (Puntual, already billed)')
            }
        } else if (s.type === 'RECURRENTE') {
            if (!s.lastBilledAt) {
                isPending = true
                console.log('  -> PENDING (Recurring, never billed)')
            } else {
                const lastBilled = new Date(s.lastBilledAt)
                const isBilledThisMonth = lastBilled.getMonth() === now.getMonth() && lastBilled.getFullYear() === now.getFullYear()
                if (!isBilledThisMonth) {
                    isPending = true
                    console.log('  -> PENDING (Recurring, last billed different month)')
                } else {
                    console.log('  -> SKIPPED (Recurring, already billed this month)')
                }
            }
        }

        console.log(`  => RESULT: ${isPending ? 'PENDING' : 'NOT PENDING'}`)
        console.log('------------------------------------------------')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

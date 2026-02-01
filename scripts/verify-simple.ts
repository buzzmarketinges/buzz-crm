
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const settings = await prisma.settings.findMany({
        select: { companyName: true }
    })
    const names = settings.map(s => s.companyName).sort()
    const expected = ['BuzzMarketing ES', 'BuzzMarketing LLC'].sort()

    if (JSON.stringify(names) === JSON.stringify(expected)) {
        console.log('VERIFICATION SUCCESS')
    } else {
        console.log('VERIFICATION FAILED: Found', names)
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

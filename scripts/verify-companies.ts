
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying companies...')

    const allSettings = await prisma.settings.findMany()
    console.log('Current Companies:', allSettings.map(s => s.companyName))

    const allowedNames = ['BuzzMarketing LLC', 'BuzzMarketing ES']

    // Find invalid companies
    const invalid = allSettings.filter(s => !allowedNames.includes(s.companyName))

    if (invalid.length > 0) {
        console.log('Found invalid companies, cleaning up...', invalid.map(s => s.companyName))
        for (const inv of invalid) {
            // Check if they have data?
            // Ideally we shouldn't delete if they have data, but user said "Only two companies".
            // Let's just warn for now in logs.
            console.log(`WARNING: Found unexpected company: ${inv.companyName} (ID: ${inv.id})`)

            // Optional: Delete if empty? 
            // For now, let's just report.
        }
    } else {
        console.log('Verification Passed: Only requested companies exist.')
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

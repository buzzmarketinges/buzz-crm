
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const cols = await prisma.$queryRaw`SELECT name FROM pragma_table_info('Service')`
        console.log("Columns:", JSON.stringify(cols, null, 2))
    } catch (e) {
        console.error(e)
    }
}

main()


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const invoices = await prisma.invoice.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            number: true,
            subtotal: true,
            totalAmount: true,
            createdAt: true,
            items: true // check items content to verify if we can calc subtotal
        }
    })

    console.log("--- LATEST 10 INVOICES ---")
    invoices.forEach(inv => {
        console.log(`INV: ${inv.number} | Subtotal: ${inv.subtotal} | Total: ${inv.totalAmount} | Time: ${inv.createdAt}`)
        // console.log("Items:", inv.items)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

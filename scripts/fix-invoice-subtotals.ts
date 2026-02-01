
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Starting Subtotal Repair...")

    // Find invoices with invalid subtotal
    const invoices = await prisma.invoice.findMany({
        where: {
            OR: [
                { subtotal: { equals: 0 } },
                { subtotal: { lt: 0.01 } }
            ]
        }
    })

    console.log(`Found ${invoices.length} invoices with invalid subtotal.`)

    for (const inv of invoices) {
        let newSubtotal = 0;
        let calculated = false;

        // Strategy 1: Calculate from Items
        try {
            if (inv.items) {
                const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
                if (Array.isArray(items) && items.length > 0) {
                    newSubtotal = items.reduce((acc: number, item: any) => {
                        const price = Number(item.price || 0)
                        const discount = Number(item.discount || 0)
                        const finalPrice = discount > 0 ? price * ((100 - discount) / 100) : price
                        return acc + finalPrice
                    }, 0)
                    calculated = true;
                    // console.log(`[${inv.number}] Calculated from items: ${newSubtotal}`)
                }
            }
        } catch (e) {
            console.warn(`[${inv.number}] Failed to parse items:`, e)
        }

        // Strategy 2: Reverse from Total (Fallback)
        if (!calculated || newSubtotal === 0) {
            if (Number(inv.totalAmount) > 0) {
                const total = Number(inv.totalAmount)
                const taxRate = Number(inv.taxRate || 0) / 100
                const withholdingRate = Number(inv.withholdingRate || 0) / 100
                const factor = 1 + taxRate - withholdingRate

                if (factor !== 0) {
                    newSubtotal = total / factor
                    calculated = true;
                    console.log(`[${inv.number}] Reverse calculated from total (${total}): ${newSubtotal} (Rates: +${taxRate * 100}% -${withholdingRate * 100}%)`)
                }
            }
        }

        // Update if we have a value
        if (calculated && newSubtotal > 0) {
            // Fix rounding errors
            newSubtotal = Math.round(newSubtotal * 100) / 100

            console.log(`Updating ${inv.number}: Old Subtotal=${inv.subtotal} -> New=${newSubtotal}`)
            await prisma.invoice.update({
                where: { id: inv.id },
                data: { subtotal: newSubtotal }
            })
        } else {
            console.log(`Skipping ${inv.number}: Could not calculate subtotal.`)
        }
    }

    console.log("Repair finished.")
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

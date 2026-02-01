
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function deepSerialize(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'number' || typeof obj === 'string' || typeof obj === 'boolean') return obj

    if (obj instanceof Date) {
        return obj.toISOString()
    }

    if (typeof obj === 'object') {
        if (typeof obj.toNumber === 'function') {
            return obj.toNumber()
        }
        if ('s' in obj && 'e' in obj && 'd' in obj) {
            return Number(obj)
        }
    }

    if (Array.isArray(obj)) {
        return obj.map(deepSerialize)
    }

    if (typeof obj === 'object') {
        const newObj: any = {}
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = deepSerialize(obj[key])
            }
        }
        return newObj
    }

    return obj
}

async function main() {
    console.log("Fetching invoices...")
    const invoices = await prisma.invoice.findMany({ take: 1 })
    if (invoices.length === 0) {
        console.log("No invoices found.")
        return
    }

    const inv = invoices[0]
    console.log("Raw field type (taxRate):", typeof inv.taxRate, inv.taxRate?.constructor?.name)
    console.log("Is toNumber function?", typeof (inv.taxRate as any).toNumber === 'function')

    const serialized = deepSerialize(inv)
    console.log("Serialized taxRate:", serialized.taxRate, typeof serialized.taxRate)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

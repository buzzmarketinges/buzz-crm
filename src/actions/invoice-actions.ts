'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getTenantId } from "@/lib/tenant"

// Helper to serialize Decimal to number (or string if preferred, but number is usually fine for display unless huge precision needed)
// Also serializing Dates to strings ensures safe passing to Client Components without Next.js warnings about Dates (though Dates are usually supported, plain JSON is safer).
// Helper to serialize Decimal to number and Date to string recursively
// Helper to serialize Decimal to number and Date to string recursively
function deepSerialize(obj: any): any {
    if (obj === null || obj === undefined) return obj

    // Arrays (check first to avoid object confusion)
    if (Array.isArray(obj)) {
        return obj.map(deepSerialize)
    }

    // Primitives
    if (typeof obj === 'number' || typeof obj === 'string' || typeof obj === 'boolean') return obj

    // Dates
    if (obj instanceof Date) {
        return obj.toISOString()
    }

    // Prisma Decimal
    // Instances of Decimal have .toNumber()
    // We also check for the internal shape { s, e, d } just in case it's a plain object literal resembling a Decimal
    if (typeof obj === 'object') {
        // Safe check for function (Decimal.js instances)
        if (typeof (obj as any).toNumber === 'function') {
            return (obj as any).toNumber()
        }
        // Safe check for serialized/internal Decimal structure
        if ('s' in obj && 'e' in obj && 'd' in obj && Array.isArray((obj as any).d)) {
            return Number(obj)
        }
    }

    // Generic Object (Recursive)
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

function serializeInvoice(invoice: any) {
    if (!invoice) return null

    // Explicitly handle known Decimal fields to guarantee number conversion
    // This avoids relying solely on deepSerialize which might miss some cases or be skipped
    return {
        ...deepSerialize(invoice),
        totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : 0,
        subtotal: invoice.subtotal ? Number(invoice.subtotal) : 0,
        taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : 0,
        taxRate: invoice.taxRate ? Number(invoice.taxRate) : 0,
        withholdingAmount: invoice.withholdingAmount ? Number(invoice.withholdingAmount) : 0,
        withholdingRate: invoice.withholdingRate ? Number(invoice.withholdingRate) : 0,
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString() : null,
        createdAt: invoice.createdAt ? new Date(invoice.createdAt).toISOString() : null,
        updatedAt: invoice.updatedAt ? new Date(invoice.updatedAt).toISOString() : null,
    }
}

// Update getInvoices to support filtering
// If no args, returns ACTIVE (unarchived) invoices by default.
// Pass { archived: true } to get archived.
export async function getInvoices(filter?: { archived?: boolean }) {
    try {
        const tenantId = await getTenantId()
        const where: any = { settingsId: tenantId }

        if (filter?.archived === true) {
            where.isArchived = true
        } else {
            // Default: Show only NON-archived
            where.isArchived = false
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: { company: true },
            orderBy: { createdAt: 'desc' }
        })
        return invoices.map(serializeInvoice)
    } catch (error) {
        console.error("Error fetching invoices:", error)
        return []
    }
}

export async function getInvoice(id: string) {
    try {
        const tenantId = await getTenantId()
        const invoice = await prisma.invoice.findFirst({
            where: { id, settingsId: tenantId },
            include: {
                company: true,
                rectifiesInvoice: { select: { id: true, number: true, issueDate: true } },
                rectifiedBy: { select: { id: true, number: true, issueDate: true } }
            }
        })
        return serializeInvoice(invoice)
    } catch (error) {
        console.error("Error getting invoice:", error)
        return null
    }
}

export async function updateInvoiceStatus(id: string, status: string) {
    try {
        const tenantId = await getTenantId()
        await prisma.invoice.updateMany({
            where: { id, settingsId: tenantId },
            data: { status }
        })
        return { success: true }
    } catch (error) {
        console.error("Error updating invoice status:", error)
        return { success: false, error: "Failed to update status" }
    }
}

export async function toggleInvoiceArchive(id: string, isArchived: boolean) {
    try {
        const tenantId = await getTenantId()
        await prisma.invoice.updateMany({
            where: { id, settingsId: tenantId },
            data: { isArchived }
        })
        revalidatePath('/billing') // Revalidate billing page
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update archive status" }
    }
}

export async function createRectificativa(
    originalInvoiceId: string,
    items: { name: string, price: number, discount?: number, reason?: string }[]
) {
    try {
        const tenantId = await getTenantId()

        const original = await prisma.invoice.findFirst({
            where: { id: originalInvoiceId, settingsId: tenantId },
            include: { company: true }
        })
        if (!original) return { success: false, error: "Factura original no encontrada" }
        if (original.isRectificativa) return { success: false, error: "No se puede rectificar una factura rectificativa" }

        const settings = await prisma.settings.findUnique({ where: { id: tenantId } })
        if (!settings) return { success: false, error: "Ajustes no encontrados" }

        const finalItems = items.map(i => ({
            name: i.reason ? `${i.name} (${i.reason})` : i.name,
            price: Number(i.price),
            discount: Number(i.discount || 0)
        }))

        const subtotal = finalItems.reduce((acc, item) => {
            const finalPrice = item.discount > 0 ? item.price * ((100 - item.discount) / 100) : item.price
            return acc + finalPrice
        }, 0)

        const applyTax = settings.taxEnabled && !original.company.canaryTaxExempt
        const taxRate = applyTax ? Number(settings.taxRate) : 0
        const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0

        const withholdingRate = settings.withholdingEnabled ? Number(settings.withholdingRate) : 0
        const withholdingAmount = settings.withholdingEnabled ? subtotal * (withholdingRate / 100) : 0

        const total = subtotal + taxAmount - withholdingAmount

        const issueDate = settings.simulatedDate ? new Date(settings.simulatedDate) : new Date()
        const year = issueDate.getFullYear()
        let prefix = settings.rectificativaPrefix || "R"
        prefix = prefix.replace(/%yyyy%/g, year.toString()).replace(/%yy%/g, year.toString().slice(-2))
        const numberStr = settings.rectificativaNextNumber.toString().padStart(2, '0')
        const invoiceFullNumber = `${prefix}${numberStr}`

        const rectificativa = await prisma.invoice.create({
            data: {
                number: invoiceFullNumber,
                companyId: original.companyId,
                status: "CREATED",
                subtotal,
                taxRate,
                taxAmount,
                withholdingRate,
                withholdingAmount,
                totalAmount: total,
                items: JSON.stringify(finalItems),
                issueDate,
                settingsId: tenantId,
                isRectificativa: true,
                rectifiesInvoiceId: original.id
            }
        })

        await prisma.settings.update({
            where: { id: tenantId },
            data: { rectificativaNextNumber: { increment: 1 } }
        })

        await prisma.invoice.update({
            where: { id: original.id },
            data: { status: "RECTIFICADA" }
        })

        revalidatePath('/billing')
        revalidatePath(`/invoices/${original.id}`)

        return { success: true, id: rectificativa.id }
    } catch (error) {
        console.error("Error creating rectificativa:", error)
        return { success: false, error: "Error al generar la factura rectificativa" }
    }
}

export async function deleteInvoice(id: string) {
    try {
        const tenantId = await getTenantId()
        // Check manually or use deleteMany to avoid error if not found (though deleteMany returns {count})
        // For simplicity and to match return, let's use valid tenant check:
        const exists = await prisma.invoice.count({ where: { id, settingsId: tenantId } })
        if (!exists) return { success: false, error: "Not found" }

        await prisma.invoice.delete({ where: { id } })
        revalidatePath('/billing')
        revalidatePath(`/clients`)
        return { success: true }
    } catch (error) {
        console.error("Error deleting invoice:", error)
        return { success: false, error: "Failed to delete invoice" }
    }
}

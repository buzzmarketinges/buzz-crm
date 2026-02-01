'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getTenantId } from "@/lib/tenant"

export interface ServiceFormValues {
    name: string
    price: number
    discount?: number
    companyId: string
    startDate: Date
    endDate?: Date
    type: 'PUNTUAL' | 'RECURRENTE'
    billingOption?: 'FULL' | 'PRORATED' | 'NONE'
    billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    serviceTemplateId?: string
}

export async function createService(data: ServiceFormValues) {
    // 1. Create the main service
    // Ensure we use the exact startDate provided (which might be simulated), not new Date() for creation logic if passed.

    // If PRORATED or FULL, we essentially want the service to be "Pending Billing".
    // setting lastBilledAt to NULL ensures it is picked up.

    // To distinguish Prorated vs Full first bill, we can append a flag to the description if it's empty, or just rely on calculating it dynamically.
    // However, to be robust without schema changes, let's prepend a minimal meta-tag in description if needed, or simply assume:
    // "If it's a new Recurring service starting mid-month (day > 1), check the user preference."
    // Since we can't easily persist the user preference without a field, I will append a hidden tag or use description. 
    // Let's use `description` field.

    let description = "";
    if (data.billingOption === 'PRORATED') {
        description = "BILLING:PRORATED";
    } else if (data.billingOption === 'FULL') {
        description = "BILLING:FULL";
    }

    // Append billing cycle info if present
    if (data.billingCycle) {
        description += ` CYCLE:${data.billingCycle}`;
    }


    const tenantId = await getTenantId()

    const service = await prisma.service.create({
        data: {
            name: data.name,
            description: description, // Store billing metadata here
            price: data.price,
            discount: data.discount || 0,
            companyId: data.companyId,
            startDate: data.startDate, // Use the provided date!
            endDate: data.endDate,
            type: data.type,
            isActive: true,
            lastBilledAt: null, // Always pending first bill
            serviceTemplateId: data.serviceTemplateId || null,
            settingsId: tenantId
        }
    })

    // We DO NOT create a second service anymore.
    // The billing engine (getPendingInvoices) will handle the proration logic based on the 'BILLING:PRORATED' tag.

    revalidatePath(`/clients/${data.companyId}`)
    revalidatePath('/services')
    return { id: service.id }
}

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

export async function getServices(companyId?: string) {
    const tenantId = await getTenantId()
    const services = await prisma.service.findMany({
        where: {
            settingsId: tenantId,
            ...(companyId ? { companyId } : {})
        },
        include: {
            company: {
                select: {
                    id: true,
                    name: true,
                    billingEmail: true
                }
            },
            serviceTemplate: true
        },
        orderBy: {
            startDate: 'desc'
        }
    })

    // Use deepSerialize to ensure NO decimals leak
    return deepSerialize(services).map((s: any) => ({
        ...s,
        price: Number(s.price),
        discount: Number(s.discount || 0)
    }))
}

export async function deleteService(serviceId: string, companyId: string) {
    try {
        const tenantId = await getTenantId()
        // Ensure ownership
        const startFn = await prisma.service.count({ where: { id: serviceId, settingsId: tenantId } })
        if (startFn === 0) return

        await prisma.service.delete({
            where: { id: serviceId }
        })
        revalidatePath(`/clients/${companyId}`)
        revalidatePath('/services')
    } catch (error) {
        console.log("Error deleting service (might already be deleted):", error)
    }
}

export async function toggleServiceStatus(id: string, isActive: boolean) {
    const tenantId = await getTenantId()
    await prisma.service.updateMany({ // updateMany helps safely filter by logic
        where: { id, settingsId: tenantId },
        data: { isActive }
    })
    revalidatePath('/services')
}

// --- Service Templates Actions ---

export async function getServiceTemplates() {
    const tenantId = await getTenantId()
    return await prisma.serviceTemplate.findMany({
        where: { settingsId: tenantId },
        orderBy: { name: 'asc' }
    })
}

export async function createServiceTemplate(name: string) {
    const tenantId = await getTenantId()
    // Check if exists
    const existing = await prisma.serviceTemplate.findFirst({
        where: { name, settingsId: tenantId }
    })
    if (existing) return existing

    const template = await prisma.serviceTemplate.create({
        data: { name, settingsId: tenantId }
    })
    revalidatePath('/services')
    return template
}

export async function deleteServiceTemplate(id: string) {
    await prisma.serviceTemplate.delete({
        where: { id }
    })
    revalidatePath('/services')
}

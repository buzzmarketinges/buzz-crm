'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getTenantId } from "@/lib/tenant"

// Helper to serialize Decimal to number and Date to string recursively
function deepSerialize(obj: any): any {
    if (obj === null || obj === undefined) return obj

    if (Array.isArray(obj)) {
        return obj.map(deepSerialize)
    }

    if (typeof obj === 'number' || typeof obj === 'string' || typeof obj === 'boolean') return obj

    if (obj instanceof Date) {
        return obj.toISOString()
    }

    if (typeof obj === 'object') {
        if (typeof (obj as any).toNumber === 'function') {
            return (obj as any).toNumber()
        }
        if ('s' in obj && 'e' in obj && 'd' in obj && Array.isArray((obj as any).d)) {
            return Number(obj)
        }
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

// Helper for serialization
function serializeCompany(company: any) {
    if (!company) return null
    // Use deepSerialize first to handle all nested Decimals/Dates automatically
    const clean = deepSerialize(company)

    // We can still do specific formatting if needed, but deepSerialize handles the hard part.
    // However, to keep existing specific logic (if any specific date formatting was intentional beyond ISO):
    // The previous code verified .toISOString(), deepSerialize does .toISOString().
    // So deepSerialize replaces the need for the manual map below essentially.

    return clean
}

// --- Companies ---

export async function getCompanies() {
    try {
        const tenantId = await getTenantId()
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        const companies = await prisma.company.findMany({
            where: { settingsId: tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { invoices: true, services: true } },
                services: { select: { isActive: true, endDate: true } }
            }
        })

        return companies.map(c => {
            const hasActiveServices = c.services.some(s => s.isActive)
            const hasRecentServices = c.services.some(s => {
                // If service has endDate, check if it's within last 3 months
                // Use new Date(s.endDate) if it's not null.
                return s.endDate ? new Date(s.endDate) > threeMonthsAgo : false
            })

            const isActive = hasActiveServices || hasRecentServices

            // We omit services from the returned object to match previous lightweight structure
            const { services, ...rest } = c

            return {
                ...rest,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
                isActive
            }
        })
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function getCompany(id: string) {
    try {
        const tenantId = await getTenantId()
        const company = await prisma.company.findFirst({
            where: { id, settingsId: tenantId },
            include: { contacts: true, services: true, invoices: true }
        })
        return serializeCompany(company)
    } catch (error) {
        return null
    }
}

export async function createCompany(formData: FormData) {
    const tenantId = await getTenantId()
    const data = {
        name: formData.get("name") as string,
        businessName: formData.get("businessName") as string,
        taxId: formData.get("taxId") as string,
        address: formData.get("address") as string,
        billingEmail: formData.get("billingEmail") as string,
        settingsId: tenantId
    }

    await prisma.company.create({ data })
    revalidatePath("/clients")
    redirect("/clients")
}

export async function updateCompany(id: string, formData: FormData) {
    const tenantId = await getTenantId()
    const data = {
        name: formData.get("name") as string,
        businessName: formData.get("businessName") as string,
        taxId: formData.get("taxId") as string,
        address: formData.get("address") as string,
        billingEmail: formData.get("billingEmail") as string,
    }

    // Ensure company belongs to tenant
    const count = await prisma.company.count({ where: { id, settingsId: tenantId } })
    if (count === 0) return { success: false, error: "Company not found" }

    await prisma.company.update({
        where: { id },
        data
    })
    revalidatePath(`/clients/${id}`)
    revalidatePath("/clients")
    return { success: true }
}

export async function deleteCompany(id: string) {
    const tenantId = await getTenantId()
    // Ensure company belongs to tenant
    const count = await prisma.company.count({ where: { id, settingsId: tenantId } })
    if (count === 0) return

    await prisma.company.delete({ where: { id } })
    revalidatePath("/clients")
}

// --- Contacts ---

export async function createContact(companyId: string, formData: FormData) {
    const tenantId = await getTenantId()
    // Verify company ownership
    const company = await prisma.company.findFirst({ where: { id: companyId, settingsId: tenantId } })
    if (!company) return

    await prisma.contact.create({
        data: {
            companyId,
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            role: formData.get("role") as string,
        }
    })
    revalidatePath(`/clients/${companyId}`)
}

export async function deleteContact(id: string, companyId: string) {
    const tenantId = await getTenantId()
    // Verify company ownership (indirectly via contact -> company)
    // Or just check if contact exists and its company belongs to tenant
    const contact = await prisma.contact.findUnique({
        where: { id },
        include: { company: true }
    })

    if (contact && contact.company.settingsId === tenantId) {
        await prisma.contact.delete({ where: { id } })
        revalidatePath(`/clients/${companyId}`)
    }
}


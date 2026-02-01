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

// Helper to get or create settings (singleton pattern logic for DB)
export async function getSettings() {
    const tenantId = await getTenantId()

    let settings = null
    try {
        console.log("getSettings: Fetching settings for tenantId:", tenantId)
        settings = await prisma.settings.findUnique({
            where: { id: tenantId }
        })
    } catch (error) {
        console.error("Error fetching settings:", error)
        // Return a fallback object if DB fails, to prevent UI crash during dev
        return {
            id: "fallback",
            companyName: "BuzzMarketing (Fallback)",
            companyAddress: "",
            companyEmail: "",
            companyTaxId: "",
            bankBeneficiary: "",
            bankIban: "",
            bankName: "",
            bankAddress: "",
            bankSwift: "",
            invoicePrefix: "INV-",
            invoiceNextNumber: 1,
            emailSmtpHost: "",
            emailSmtpPort: 587,
            emailSmtpUser: "",
            emailSmtpPass: "",
            emailSubject: "Factura %numfactura% - %nombreempresa%",
            emailBodyTemplate: "",
            localSavePath: "C:/Facturas",
            simulatedDate: null,
            yearlyGoal: 100000,
            taxEnabled: false,
            taxRate: 21,
            withholdingEnabled: false,
            withholdingRate: 15,
            isAdminMode: false,
            updatedAt: new Date()
        }
    }

    if (!settings) {
        console.warn(`getSettings: Settings NOT FOUND for tenantId: ${tenantId} (likely deleted). Redirecting to selection.`)
        redirect('/select-company')
    }

    return deepSerialize(settings)
}

export async function updateSettings(data: any) {
    try {
        const tenantId = await getTenantId()

        const updateData = {
            ...data,
            emailSmtpPort: data.emailSmtpPort ? parseInt(data.emailSmtpPort.toString()) : undefined,
            invoiceNextNumber: data.invoiceNextNumber ? parseInt(data.invoiceNextNumber.toString()) : undefined,
            simulatedDate: data.simulatedDate ? new Date(data.simulatedDate.toString()) : null,
            yearlyGoal: data.yearlyGoal ? Number(data.yearlyGoal) : undefined,
            isAdminMode: data.isAdminMode === 'on' || data.isAdminMode === 'true' || data.isAdminMode === true,

            commercialName: data.commercialName as string,
            taxIdLabel: data.taxIdLabel as string,

            // Tax Settings
            taxEnabled: data.taxEnabled === 'on' || data.taxEnabled === 'true' || data.taxEnabled === true,
            taxRate: data.taxRate ? Number(data.taxRate) : undefined,
            withholdingEnabled: data.withholdingEnabled === 'on' || data.withholdingEnabled === 'true' || data.withholdingEnabled === true,
            withholdingRate: data.withholdingRate ? Number(data.withholdingRate) : undefined
        }

        await prisma.settings.update({
            where: { id: tenantId },
            data: updateData
        })

        revalidatePath("/", "layout")
        return { success: true }
    } catch (error) {
        console.error("Error updating settings:", error)
        return { success: false, error: "Failed to update settings" }
    }
}

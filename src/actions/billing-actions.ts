'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getTenantId } from "@/lib/tenant"

export type PendingItem = {
    companyId: string
    companyName: string
    items: {
        serviceId: string
        name: string
        price: number
        discount?: number
        type: string
    }[]
    total: number
}

export async function getPendingInvoices() {
    try {
        const tenantId = await getTenantId()
        const services = await prisma.service.findMany({
            where: {
                isActive: true,
                settingsId: tenantId
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        // No need to map manually, Prisma returns correct types
        const mappedServices = services.map(s => ({
            ...s,
            price: Number(s.price), // Decimal to Number
            discount: Number(s.discount || 0)
        }))

        const settings = await prisma.settings.findUnique({ where: { id: tenantId } })
        const now = settings?.simulatedDate ? new Date(settings.simulatedDate) : new Date()

        console.log("--- DEBUG PENDING INVOICES ---")
        console.log("Current System Date (Simulated?):", now)
        console.log("Total Services Found:", services.length)

        const pendingMap = new Map<string, PendingItem>()

        for (const service of mappedServices) {
            let isPending = false

            // Date Checks
            if (service.startDate && new Date(service.startDate) > now) {
                console.log(`Service ${service.name}: FUTURE START (${new Date(service.startDate).toLocaleDateString()})`)
                continue
            }
            if (service.endDate && new Date(service.endDate) < now) {
                console.log(`Service ${service.name}: EXPIRED (${new Date(service.endDate).toLocaleDateString()})`)
                continue
            }

            if (service.type === 'PUNTUAL') {
                if (!service.lastBilledAt) isPending = true
            } else if (service.type === 'RECURRENTE') {
                // Rule: Recurring invoices generate on the 1st of the month
                // If today is >= 1st, we should check if they are billed for THIS month.

                // If never billed, it's pending pending immediately (if today >= 1st, which is always true)
                if (!service.lastBilledAt) {
                    isPending = true
                    console.log(`Service ${service.name} (Recurring): PENDING (Never billed)`)
                } else {
                    const lastBilled = new Date(service.lastBilledAt)
                    // Check if billed in the same month and year as "now"
                    const isBilledThisMonth = lastBilled.getMonth() === now.getMonth() && lastBilled.getFullYear() === now.getFullYear()

                    if (!isBilledThisMonth) {
                        // It hasn't been billed this month. 
                        // Since we are hypothetically on or after the 1st (as logic dictates trigger), it's pending.
                        isPending = true
                        console.log(`Service ${service.name} (Recurring): PENDING (Last billed: ${lastBilled.toLocaleDateString()}, Target: ${now.toLocaleDateString()})`)
                    } else {
                        console.log(`Service ${service.name} (Recurring): SKIPPED (Already billed this month: ${lastBilled.toLocaleDateString()})`)
                    }
                }
            }

            if (isPending) {
                if (!pendingMap.has(service.companyId)) {
                    pendingMap.set(service.companyId, {
                        companyId: service.companyId,
                        companyName: service.company.name,
                        items: [],
                        total: 0
                    })
                }
                const entry = pendingMap.get(service.companyId)!
                // Calculate Price (Handle Proration)
                let finalPrice = Number(service.price)
                let displayName = service.name

                // Check for Proration logic: 
                // If it's the FIRST bill (never billed) AND it is flagged as PRORATED in description
                if (service.type === 'RECURRENTE' && !service.lastBilledAt && service.description?.includes('BILLING:PRORATED')) {
                    const start = new Date(service.startDate)
                    const year = start.getFullYear()
                    const month = start.getMonth()
                    // Check if start month matches current month (otherwise full bill if we missed the start month? 
                    // No, usually assume we are billing for the current active month or the start month.
                    // If the start date is in the past (e.g. last month) and we never billed, technically we should bill that month + this month?
                    // For simplicity, let's assume we are generating the bill for the month of the 'startDate' (if we are in that month) OR 
                    // if we are past that month, we probably want to bill the current month fully + arrears?
                    // Let's stick to the user's specific case: "Starts mid-month".

                    // Simple logic: If we are in the same month as startDate, calculate remaining days.
                    if (now.getMonth() === month && now.getFullYear() === year) {
                        const daysInMonth = new Date(year, month + 1, 0).getDate()
                        const startDay = start.getDate()
                        const remainingDays = Math.max(0, daysInMonth - startDay + 1)
                        finalPrice = (finalPrice / 30) * remainingDays // Using 30 as divisor as per common practice or use daysInMonth? Let's use 30 to match UI estimation.
                        displayName = `${displayName} (Prorrateado)`
                    }
                }

                const discount = service.discount || 0
                if (discount > 0) {
                    finalPrice = finalPrice * ((100 - discount) / 100)
                }

                entry.items.push({
                    serviceId: service.id,
                    name: displayName,
                    price: Number(service.price),
                    discount: discount,
                    type: service.type
                })
                entry.total += finalPrice
            }
        }


        return Array.from(pendingMap.values())

    } catch (error) {
        console.error(error)
        return []
    }
}

export async function skipPendingInvoice(companyId: string) {
    try {
        const tenantId = await getTenantId()
        const settings = await prisma.settings.findUnique({ where: { id: tenantId } })
        const now = settings?.simulatedDate ? new Date(settings.simulatedDate) : new Date()

        // 1. Get potentially pending services for this company
        const services = await prisma.service.findMany({
            where: {
                companyId,
                isActive: true,
                settingsId: tenantId
            }
        })

        let updatedCount = 0

        for (const s of services) {
            // Check if it is actually pending based on our logic
            const service = {
                ...s,
                price: Number(s.price),
                isActive: Boolean(s.isActive)
            }

            let isPending = false

            // --- LOGIC DUPLICATED FROM getPendingInvoices (Ideally refactor this to a shared helper) ---
            // Date Checks
            if (service.startDate && new Date(service.startDate) > now) continue
            if (service.endDate && new Date(service.endDate) < now) continue

            if (service.type === 'PUNTUAL') {
                if (!service.lastBilledAt) isPending = true
            } else if (service.type === 'RECURRENTE') {
                if (!service.lastBilledAt) {
                    isPending = true
                } else {
                    const lastBilled = new Date(service.lastBilledAt)
                    const isBilledThisMonth = lastBilled.getMonth() === now.getMonth() && lastBilled.getFullYear() === now.getFullYear()
                    if (!isBilledThisMonth) isPending = true
                }
            }
            // -----------------------------------------------------------------------------------------

            if (isPending) {
                // Update lastBilledAt to NOW
                // Use Raw SQL update
                const newLastBilledAt = now.toISOString()
                await prisma.$executeRaw`
                    UPDATE Service 
                    SET lastBilledAt = ${newLastBilledAt} 
                    WHERE id = ${service.id}
                 `
                updatedCount++
            }
        }

        revalidatePath('/billing')
        return { success: true, count: updatedCount }
    } catch (error) {
        console.error("Error skipping pending invoice:", error)
        return { success: false, error: "Failed to skip invoice" }
    }
}

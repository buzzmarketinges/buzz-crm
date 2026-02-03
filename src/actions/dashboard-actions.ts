'use server'

import prisma from "@/lib/prisma"
import { getTenantId } from "@/lib/tenant"

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const FULL_MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

export async function getDashboardStats() {
    try {
        const tenantId = await getTenantId()
        const settings = await prisma.settings.findUnique({ where: { id: tenantId } })
        const now = settings?.simulatedDate ? new Date(settings.simulatedDate) : new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        lastDayOfMonth.setHours(23, 59, 59, 999)

        // Previous Month to calculate growth
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        lastDayOfLastMonth.setHours(23, 59, 59, 999)

        // 1. Recurring Revenue & Growth
        const invoicesLastMonth = await prisma.invoice.findMany({
            where: {
                settingsId: tenantId,
                issueDate: {
                    gte: firstDayOfLastMonth,
                    lte: lastDayOfLastMonth
                }
            },
            select: { items: true, totalAmount: true, subtotal: true, taxRate: true, withholdingRate: true }
        })

        // Helper to calc Net/Gross for an item in an invoice
        const calcItemValues = (item: any, inv: any) => {
            const price = Number(item.price || 0)
            const discount = Number(item.discount || 0)
            const net = price * ((100 - discount) / 100)

            // Calculate tax/withholding impact for this item based on invoice rates
            // If invoice has subtotal 0, avoid NaN
            const taxRate = Number(inv.taxRate || 0)
            const withholdingRate = Number(inv.withholdingRate || 0)

            // Gross = Net + VAT - IRPF (This is "Total" strictly speaking)
            // User asked for "Facturación total ... impuestos incluidos" (Tax included) vs "Facturación Neta" (Tax excluded)
            // Usually Net = Base. Gross = Base + Tax.
            // Withholding is a payment method, not exactly "Tax included" in the sense of VAT.
            // But let's assume "Gross" = The final totalAmount of the invoice?
            // Yes, user said "Gross... taxes included".
            const gross = net * (1 + (taxRate / 100) - (withholdingRate / 100))

            return { net, gross }
        }

        let lastMonthRecurring = { net: 0, gross: 0 }
        let lastMonthInvoiced = { net: 0, gross: 0 }

        for (const inv of invoicesLastMonth) {
            // Invoice Totals
            lastMonthInvoiced.net += Number(inv.subtotal || inv.totalAmount) // Fallback if subtotal missing (old data)
            lastMonthInvoiced.gross += Number(inv.totalAmount)

            // Recurring Items
            try {
                const items = JSON.parse(inv.items) as any[]
                items.forEach(item => {
                    if (item.type === 'RECURRENTE') {
                        const vals = calcItemValues(item, inv)
                        lastMonthRecurring.net += vals.net
                        lastMonthRecurring.gross += vals.gross
                    }
                })
            } catch (e) { }
        }

        // 2. Invoiced This Month
        const invoicesThisMonth = await prisma.invoice.findMany({
            where: {
                settingsId: tenantId,
                issueDate: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth
                }
            },
            select: { totalAmount: true, subtotal: true, status: true, items: true, taxRate: true, withholdingRate: true }
        })

        let monthlyRecurring = { net: 0, gross: 0 }
        let monthlyInvoiced = { net: 0, gross: 0 }

        invoicesThisMonth.forEach(inv => {
            monthlyInvoiced.net += Number(inv.subtotal || inv.totalAmount)
            monthlyInvoiced.gross += Number(inv.totalAmount)

            try {
                const items = JSON.parse(inv.items) as any[]
                items.forEach(item => {
                    if (item.type === 'RECURRENTE') {
                        const vals = calcItemValues(item, inv)
                        monthlyRecurring.net += vals.net
                        monthlyRecurring.gross += vals.gross
                    }
                })
            } catch (e) { }
        })

        // Growth
        const calcGrowth = (current: number, previous: number) => {
            if (previous > 0) return ((current - previous) / previous) * 100
            if (current > 0) return 100
            return 0
        }

        const recurringGrowth = {
            net: calcGrowth(monthlyRecurring.net, lastMonthRecurring.net),
            gross: calcGrowth(monthlyRecurring.gross, lastMonthRecurring.gross)
        }

        const monthlyInvoicedGrowth = {
            net: calcGrowth(monthlyInvoiced.net, lastMonthInvoiced.net),
            gross: calcGrowth(monthlyInvoiced.gross, lastMonthInvoiced.gross)
        }

        // 3. Unpaid Percentage (Global / All Time) - User Requested Change
        const totalInvoicesAll = await prisma.invoice.count({
            where: { settingsId: tenantId, isArchived: false }
        })
        const unpaidInvoicesAll = await prisma.invoice.count({
            where: { settingsId: tenantId, status: { not: 'PAID' }, isArchived: false }
        }) /* Status is usually DRAFT, SENT, PAID, ERROR. Anything not PAID is unpaid. */

        const unpaidPercentage = totalInvoicesAll > 0 ? ((unpaidInvoicesAll / totalInvoicesAll) * 100) : 0

        // 4. Rececnt (Unused, skip deep fetch)
        const recentInvoices = []

        // 5. Chart Data (History)
        const oneYearAgo = new Date(now)
        oneYearAgo.setDate(1) // Prevent overflow (e.g. Jan 30 -> Feb 30 -> Mar 2)
        oneYearAgo.setMonth(now.getMonth() - 11)

        const historyInvoices = await prisma.invoice.findMany({
            where: {
                settingsId: tenantId,
                issueDate: { gte: oneYearAgo }
            },
            select: {
                issueDate: true,
                totalAmount: true,
                subtotal: true,
                taxRate: true,
                withholdingRate: true,
                items: true
            },
            orderBy: { issueDate: 'asc' }
        })

        const revenueMap = new Map<string, {
            totalNet: number,
            totalGross: number,
            recurringNet: number,
            recurringGross: number,
            punctualNet: number,
            punctualGross: number,
            monthIndex: number,
            label: string,
            fullLabel: string,
            year: number,
            month: number
        }>()

        for (let i = 0; i < 12; i++) {
            const d = new Date(oneYearAgo)
            d.setMonth(oneYearAgo.getMonth() + i)
            const key = `${d.getFullYear()}-${d.getMonth()}`
            revenueMap.set(key, {
                totalNet: 0, totalGross: 0,
                recurringNet: 0, recurringGross: 0,
                punctualNet: 0, punctualGross: 0,
                monthIndex: i,
                label: MONTH_NAMES[d.getMonth()],
                fullLabel: FULL_MONTH_NAMES[d.getMonth()],
                year: d.getFullYear(),
                month: d.getMonth()
            })
        }

        historyInvoices.forEach(inv => {
            const date = new Date(inv.issueDate)
            const key = `${date.getFullYear()}-${date.getMonth()}`
            if (revenueMap.has(key)) {
                const entry = revenueMap.get(key)!
                entry.totalNet += Number(inv.subtotal || inv.totalAmount)
                entry.totalGross += Number(inv.totalAmount)

                try {
                    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items || []
                    items.forEach((item: any) => {
                        const vals = calcItemValues(item, inv)
                        if (item.type === 'RECURRENTE') {
                            entry.recurringNet += vals.net
                            entry.recurringGross += vals.gross
                        } else {
                            entry.punctualNet += vals.net
                            entry.punctualGross += vals.gross
                        }
                    })
                } catch (e) {
                    // Fallback if item parse fails: add to punctual gross/net
                    entry.punctualNet += Number(inv.subtotal || inv.totalAmount)
                    entry.punctualGross += Number(inv.totalAmount)
                }
            }
        })

        const revenueChartData = Array.from(revenueMap.values())
            .sort((a, b) => a.monthIndex - b.monthIndex)
            .map(v => ({
                name: v.label,
                fullName: v.fullLabel,
                year: v.year,
                month: v.month,
                net: v.totalNet,
                gross: v.totalGross,
                // Breakdown for charts (Net/Gross dynamic? The chart component will need to choose)
                // Let's pass objects
                total: { net: v.totalNet, gross: v.totalGross },
                recurring: { net: v.recurringNet, gross: v.recurringGross },
                punctual: { net: v.punctualNet, gross: v.punctualGross }
            }))

        // 6. Service Distribution (Actual Billed this Month)
        // Map: Category -> { net, gross }
        const serviceDistributionMap = new Map<string, { net: number, gross: number }>()

        const invoiceItemsFlat: { serviceId: string, net: number, gross: number }[] = []
        let totalDistNet = 0
        let totalDistGross = 0

        invoicesThisMonth.forEach(inv => {
            try {
                const items = JSON.parse(inv.items) as any[]
                items.forEach(item => {
                    const vals = calcItemValues(item, inv)
                    if (item.serviceId) {
                        invoiceItemsFlat.push({ serviceId: item.serviceId, ...vals })
                    } else {
                        const cat = serviceDistributionMap.get('Otros') || { net: 0, gross: 0 }
                        cat.net += vals.net
                        cat.gross += vals.gross
                        serviceDistributionMap.set('Otros', cat)
                    }
                    totalDistNet += vals.net
                    totalDistGross += vals.gross
                })
            } catch (e) { }
        })

        // Fetch categories (same as before)
        const serviceIds = invoiceItemsFlat.map(i => i.serviceId) // duplicates ok for 'in' query? yes. better set.
        const distinctIds = Array.from(new Set(serviceIds))

        const servicesWithCategories = await prisma.service.findMany({
            where: { id: { in: distinctIds }, settingsId: tenantId },
            select: { id: true, serviceTemplate: { select: { name: true } } }
        })
        const catMap = new Map<string, string>()
        servicesWithCategories.forEach(s => catMap.set(s.id, s.serviceTemplate?.name || 'Otros'))

        invoiceItemsFlat.forEach(item => {
            const catName = catMap.get(item.serviceId) || 'Otros'
            const current = serviceDistributionMap.get(catName) || { net: 0, gross: 0 }
            current.net += item.net
            current.gross += item.gross
            serviceDistributionMap.set(catName, current)
        })

        const serviceDistributionData = Array.from(serviceDistributionMap.entries())
            .map(([name, val]) => ({
                name,
                net: Number(val.net.toFixed(2)),
                gross: Number(val.gross.toFixed(2)),
                percentageNet: totalDistNet > 0 ? (val.net / totalDistNet) * 100 : 0,
                percentageGross: totalDistGross > 0 ? (val.gross / totalDistGross) * 100 : 0
            }))
            .sort((a, b) => b.net - a.net)

        return {
            recurringRevenue: monthlyRecurring,
            recurringGrowth,
            monthlyInvoiced,
            monthlyInvoicedGrowth,
            unpaidPercentage,
            totalInvoicesCount: totalInvoicesAll,
            recentInvoices: [],
            revenueChartData,
            serviceDistributionData,
            yearlyGoal: Number(settings?.yearlyGoal || 100000)
        }

    } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        return {
            recurringRevenue: { net: 0, gross: 0 },
            recurringGrowth: { net: 0, gross: 0 },
            monthlyInvoiced: { net: 0, gross: 0 },
            monthlyInvoicedGrowth: { net: 0, gross: 0 },
            unpaidPercentage: 0,
            totalInvoicesCount: 0,
            recentInvoices: [],
            revenueChartData: [],
            serviceDistributionData: [],
            yearlyGoal: 100000
        }
    }
}

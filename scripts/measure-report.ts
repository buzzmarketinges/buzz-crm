import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const p = await prisma.project.findFirst({
        include: { services: true, expenses: true }
    })
    
    if (!p) {
        console.log("No components found")
        return
    }

    console.time('Full Report Execution')
    
    const serviceIds = p.services.map(s => s.id)
    const expenses = p.expenses

    const invoices = await prisma.invoice.findMany({
        where: {
            settingsId: p.settingsId,
            companyId: p.companyId,
            status: { not: 'DRAFT' }
        },
        select: {
            issueDate: true,
            items: true,
            taxRate: true,
            withholdingRate: true
        }
    })

    const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const monthlyMap = new Map()

    const start = new Date(p.startDate)
    const now = new Date()
    const monthDiff = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth()
    const monthsToShow = Math.max(6, monthDiff + 1)

    for (let i = 0; i < monthsToShow; i++) {
        const d = new Date(start)
        d.setMonth(start.getMonth() + i)
        if (d > now) break;

        const key = `${d.getFullYear()}-${d.getMonth()}`
        monthlyMap.set(key, {
            month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
            income: 0,
            expenses: 0,
            total: 0
        })
    }

    expenses.forEach(exp => {
        const date = new Date(exp.date)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        if (monthlyMap.has(key)) {
            const entry = monthlyMap.get(key)!
            entry.expenses += Number(exp.amount)
            entry.total -= Number(exp.amount)
        }
    })

    invoices.forEach(inv => {
        const date = new Date(inv.issueDate)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        
        try {
            const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items || []
            let invoiceProjectIncome = 0

            items.forEach((item: any) => {
                if (item.serviceId && serviceIds.includes(item.serviceId)) {
                    invoiceProjectIncome += Number(item.price || 0)
                }
            })

            if (invoiceProjectIncome > 0 && monthlyMap.has(key)) {
                const entry = monthlyMap.get(key)!
                entry.income += invoiceProjectIncome
                entry.total += invoiceProjectIncome
            }
        } catch (e) {}
    })

    console.timeEnd('Full Report Execution')
    console.log(`Invoices count: ${invoices.length}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

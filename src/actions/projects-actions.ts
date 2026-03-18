'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getTenantId } from "@/lib/tenant"

// Helper to serialize Decimal/Date for Next.js Server Components
function deepSerialize(obj: any): any {
    if (obj === null || obj === undefined) return obj
    return JSON.parse(JSON.stringify(obj))
}

export interface ProjectFormValues {
    name: string
    description?: string
    startDate: Date
    endDate?: Date
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    companyId: string
}

export async function createProject(data: ProjectFormValues) {
    const tenantId = await getTenantId()

    const project = await prisma.project.create({
        data: {
            name: data.name,
            description: data.description || null,
            startDate: data.startDate,
            endDate: data.endDate || null,
            status: data.status,
            companyId: data.companyId,
            settingsId: tenantId
        }
    })

    revalidatePath('/projects')
    revalidatePath(`/clients/${data.companyId}`)
    return { id: project.id }
}

export async function getProjects(companyId?: string) {
    const tenantId = await getTenantId()
    const projects = await prisma.project.findMany({
        where: {
            settingsId: tenantId,
            ...(companyId ? { companyId } : {})
        },
        include: {
            company: {
                select: {
                    id: true,
                    name: true
                }
            },
            services: {
                select: {
                    id: true,
                    name: true,
                    price: true
                }
            }
        },
        orderBy: {
            startDate: 'desc'
        }
    })

    return deepSerialize(projects)
}

export async function getProject(id: string) {
    const tenantId = await getTenantId()
    const project = await prisma.project.findFirst({
        where: { id, settingsId: tenantId },
        include: {
            company: true,
            services: true,
            expenses: {
                orderBy: { date: 'desc' }
            },
            tasks: {
                orderBy: { date: 'asc' }
            }
        }
    })

    if (!project) return null

    return deepSerialize(project)
}

export async function updateProject(id: string, data: Partial<ProjectFormValues>) {
    const tenantId = await getTenantId()

    await prisma.project.updateMany({
        where: { id, settingsId: tenantId },
        data: {
            ...data,
        } as any
    })

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    return { success: true }
}

export async function deleteProject(id: string) {
    const tenantId = await getTenantId()
    await prisma.project.deleteMany({
        where: { id, settingsId: tenantId }
    })
    revalidatePath('/projects')
}

export async function linkServiceToProject(serviceId: string, projectId: string | null) {
    const tenantId = await getTenantId()
    await prisma.service.updateMany({
        where: { id: serviceId, settingsId: tenantId },
        data: { projectId }
    })
    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/services')
}

export async function getProjectReport(projectId: string) {
    const tenantId = await getTenantId()

    const project = await prisma.project.findFirst({
        where: { id: projectId, settingsId: tenantId },
        include: { services: true, expenses: true }
    })

    if (!project) return null

    const serviceIds = project.services.map(s => s.id)
    const expenses = project.expenses

    const invoices = await prisma.invoice.findMany({
        where: {
            settingsId: tenantId,
            companyId: project.companyId,
            status: { not: 'DRAFT' } // Count Sent or Paid
        },
        select: {
            issueDate: true,
            items: true,
            taxRate: true,
            withholdingRate: true
        }
    })

    const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const monthlyMap = new Map<string, { month: string, year: number, monthIndex: number, income: number, expenses: number, total: number }>()

    const start = new Date(project.startDate)
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
            year: d.getFullYear(),
            monthIndex: d.getMonth(),
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

    const calcItemValues = (item: any, inv: any) => {
        const price = Number(item.price || 0)
        const discount = Number(item.discount || 0)
        const net = price * ((100 - discount) / 100)
        const taxRate = Number(inv.taxRate || 0)
        const withholdingRate = Number(inv.withholdingRate || 0)
        const gross = net * (1 + (taxRate / 100) - (withholdingRate / 100))
        return { net, gross }
    }

    invoices.forEach(inv => {
        const date = new Date(inv.issueDate)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        
        try {
            const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items || []
            let invoiceProjectIncome = 0

            items.forEach((item: any) => {
                if (item.serviceId && serviceIds.includes(item.serviceId)) {
                    const vals = calcItemValues(item, inv)
                    invoiceProjectIncome += vals.net // Net income
                }
            })

            if (invoiceProjectIncome > 0 && monthlyMap.has(key)) {
                const entry = monthlyMap.get(key)!
                entry.income += invoiceProjectIncome
                entry.total += invoiceProjectIncome
            }
        } catch (e) {}
    })

    const chartData = Array.from(monthlyMap.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.monthIndex - b.monthIndex
    })

    const totals = chartData.reduce((acc, curr) => {
        acc.income += curr.income
        acc.expenses += curr.expenses
        acc.total += curr.total
        return acc
    }, { income: 0, expenses: 0, total: 0 })

    return {
        totals: {
            income: Number(totals.income.toFixed(2)),
            expenses: Number(totals.expenses.toFixed(2)),
            total: Number(totals.total.toFixed(2))
        },
        chartData: chartData.map(d => ({
            ...d,
            income: Number(d.income.toFixed(2)),
            expenses: Number(d.expenses.toFixed(2)),
            total: Number(d.total.toFixed(2))
        }))
    }
}

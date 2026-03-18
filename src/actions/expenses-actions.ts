'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getTenantId } from "@/lib/tenant"

export interface ExpenseFormValues {
    concept: string
    provider: string
    amount: number
    date: Date
    notes?: string
    projectId: string
}

export async function createExpense(data: ExpenseFormValues) {
    const tenantId = await getTenantId()

    const expense = await prisma.expense.create({
        data: {
            concept: data.concept,
            provider: data.provider,
            amount: data.amount,
            date: data.date,
            notes: data.notes || null,
            projectId: data.projectId,
            settingsId: tenantId
        }
    })

    revalidatePath(`/projects/${data.projectId}`)
    return { id: expense.id }
}

export async function deleteExpense(expenseId: string, projectId: string) {
    const tenantId = await getTenantId()
    await prisma.expense.deleteMany({
        where: { id: expenseId, settingsId: tenantId }
    })
    revalidatePath(`/projects/${projectId}`)
}

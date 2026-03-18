import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugReminders() {
    const setting = await prisma.settings.findFirst()
    const now = setting?.simulatedDate ? new Date(setting.simulatedDate) : new Date()
    const pastHour = new Date(now.getTime() - 6 * 60 * 60 * 1000) // 6 hours threshold for debugging

    console.log("Simulated Date in DB:", setting?.simulatedDate)
    console.log("Calculated 'now' (Comparison):", now.toISOString())
    console.log("Calculated 'pastHour' (Comparison):", pastHour.toISOString())

    const tasks = await prisma.task.findMany()

    console.log(`Total Tasks in DB: ${tasks.length}`)
    for (const t of tasks) {
        console.log(`- Task: "${t.title}" | Date: ${t.date.toISOString()} | isCompleted: ${t.isCompleted} | isReminderSent: ${t.isReminderSent}`)
    }

    await prisma.$disconnect()
}

debugReminders()

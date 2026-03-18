import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma

    if (!(globalThis as any).hasReminderInterval) {
        (globalThis as any).hasReminderInterval = true
        
        // Simulated Cron Reminders for Local Development triggers
        setInterval(async () => {
            try {
                const { sendTaskReminders } = await import("@/actions/tasks-actions")
                await sendTaskReminders()
            } catch (error) { 
                console.error("Cron Error:", error)
            }
        }, 60000) // Call every 60 seconds
    }
}

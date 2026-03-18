'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getTenantId } from "@/lib/tenant"
import nodemailer from "nodemailer"

// Task CRUD
export interface TaskFormValues {
    title: string
    description?: string
    date: Date
    endDate?: Date
    projectId?: string
}

export async function createTask(data: TaskFormValues) {
    const tenantId = await getTenantId()

    const task = await (prisma as any).task.create({
        data: {
            title: data.title,
            description: data.description || null,
            date: data.date,
            endDate: data.endDate || null,
            projectId: data.projectId || null,
            settingsId: tenantId,
            isCompleted: false
        }
    })

    if (data.projectId) {
        revalidatePath(`/projects/${data.projectId}`)
    }
    revalidatePath('/calendar')
    return { id: task.id }
}

export async function updateTaskStatus(taskId: string, isCompleted: boolean) {
    const tenantId = await getTenantId()
    const task = await (prisma as any).task.updateMany({
        where: { id: taskId, settingsId: tenantId },
        data: { isCompleted }
    })
    revalidatePath('/calendar')
    return { success: true }
}

export async function updateTask(taskId: string, data: Partial<TaskFormValues>) {
    const tenantId = await getTenantId()
    await (prisma as any).task.updateMany({
        where: { id: taskId, settingsId: tenantId },
        data: {
            title: data.title,
            description: data.description || undefined,
            date: data.date,
            endDate: data.endDate || undefined,
            projectId: data.projectId || undefined,
            isReminderSent: false
        } as any
    })
    revalidatePath('/calendar')
    if (data.projectId) revalidatePath(`/projects/${data.projectId}`)
    return { success: true }
}

export async function deleteTask(taskId: string) {
    const tenantId = await getTenantId()
    await (prisma as any).task.deleteMany({
        where: { id: taskId, settingsId: tenantId }
    })
    revalidatePath('/calendar')
}

export async function getTasks(projectId?: string) {
    const tenantId = await getTenantId()
    const tasks = await (prisma as any).task.findMany({
        where: {
            settingsId: tenantId,
            ...(projectId ? { projectId } : {})
        },
        include: {
            project: { select: { name: true, company: { select: { name: true } } } }
        },
        orderBy: { date: 'asc' }
    })
    return tasks
}

// Background Email Notification Helper For Cron
export async function sendTaskReminders() {
    const prismaLocal = new (await import('@prisma/client')).PrismaClient()
    const setting = await prismaLocal.settings.findFirst()
    
    // Support Simulation Bar if enabled
    const now = setting?.simulatedDate ? new Date(setting.simulatedDate) : new Date()
    const pastHour = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago

    const tasks = await (prismaLocal as any).task.findMany({
        where: {
            isCompleted: false,
            isReminderSent: false,
            date: { lte: now, gte: pastHour }
        },
        include: {
            settings: true,
            project: { select: { name: true, company: { select: { name: true } } } }
        }
    })

    console.log(`Cron: Found ${tasks.length} tasks ready for reminders.`)
    for (const task of tasks) {
        const settings = task.settings
        const targetEmail = settings.notificationEmail || settings.companyEmail

        if (targetEmail) {
            const transporter = nodemailer.createTransport({
                host: settings.emailSmtpHost || "smtp.example.com",
                port: settings.emailSmtpPort || 587,
                secure: settings.emailSmtpPort === 465,
                auth: {
                    user: settings.emailSmtpUser || undefined,
                    pass: settings.emailSmtpPass || undefined,
                },
            })

            try {
                await transporter.sendMail({
                    from: `"${settings.companyName}" <${settings.emailSmtpUser}>`,
                    to: targetEmail,
                    subject: `RECORDATORIO: ${task.title}`,
                    html: `
                        <div style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                            <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #2563eb;">
                                <h1 style="font-size: 17px; color: #1e3a8a; font-weight: 800; margin: 0 0 18px 0; letter-spacing: 0.05em; text-transform: uppercase;">🔔 Recordatorio de Tarea</h1>
                                <p style="font-size: 15px; color: #475569; margin-bottom: 22px;">Hola,</p>
                                <div style="background-color: #eff6ff; padding: 20px; border-radius: 12px; border: 1px solid #dbeafe; margin-bottom: 22px;">
                                     <h2 style="font-size: 16px; color: #1d4ed8; font-weight: 700; margin: 0 0 8px 0;">${task.title}</h2>
                                     ${task.project ? `
                                         <p style="font-size: 13px; font-weight: bold; color: #1e3a8a; margin: 0 0 4px 0; display: flex; align-items: center; gap: 4px;">📂 Proyecto: ${task.project.name}</p>
                                         ${task.project.company?.name ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 10px 0; display: flex; align-items: center; gap: 4px;">🏢 Empresa: ${task.project.company.name}</p>` : ""}
                                     ` : ""}
                                     ${task.description ? `<p style="font-size: 13px; color: #1e40af; margin: 0 0 12px 0; opacity: 0.9;">${task.description}</p>` : ""}
                                     <div style="font-size: 13px; color: #1e40af; font-weight: 600; border-top: 1px dashed #bfdbfe; padding-top: 12px; margin-top: 12px;">
                                          🕒 Hora: ${new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </div>
                                </div>
                                <div style="text-align: center; margin-top: 30px;">
                                     <a href="#" style="display: inline-block; padding: 11px 24px; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 3px 6px rgba(37,99,235,0.2);">Abrir en CRM</a>
                                </div>
                            </div>
                            <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">Este es un aviso automático generado por ${settings.companyName || "tu CRM"}.</p>
                        </div>
                    `
                })
                // Mark as sent
                await (prismaLocal as any).task.update({ where: { id: task.id }, data: { isReminderSent: true } })
            } catch (error) {
                console.error("Failed to send task email:", error)
            }
        }
    }
}

export async function sendDailySummary() {
    const prismaLocal = new (await import('@prisma/client')).PrismaClient()
    
    // Find all tasks for TODAY
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    const tasks = await (prismaLocal as any).task.findMany({
        where: {
            date: { gte: startOfDay, lte: endOfDay }
        },
        include: {
            settings: true,
            project: { select: { name: true, company: { select: { name: true } } } }
        },
        orderBy: { date: 'asc' }
    })

    const allSettings = await prismaLocal.settings.findMany()

    for (const setting of allSettings) {
        const targetEmail = setting.notificationEmail || setting.companyEmail
        const settingTasks = tasks.filter(t => t.settingsId === setting.id)

        if (targetEmail) {
            const transporter = nodemailer.createTransport({
                host: setting.emailSmtpHost || "smtp.example.com",
                port: setting.emailSmtpPort || 587,
                secure: setting.emailSmtpPort === 465,
                auth: {
                    user: setting.emailSmtpUser || undefined,
                    pass: setting.emailSmtpPass || undefined,
                },
            })

            let htmlContent = `
                <div style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                     <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #2563eb;">
                          <h1 style="font-size: 18px; color: #1e3a8a; font-weight: 800; margin: 0 0 18px 0; text-transform: uppercase; letter-spacing: 0.05em;">📅 Resumen Diario de Tareas</h1>
                          <p style="font-size: 14px; color: #64748b; margin-bottom: 22px;">Hola, estas son tus tareas programadas para hoy:</p>
            `
            if (settingTasks.length === 0) {
                htmlContent += `<div style="text-align: center; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;"><p style="font-size: 14px; color: #64748b; font-weight: 600; margin:0;">☕ ¡No tienes tareas programadas para hoy!</p></div>`
            } else {
                htmlContent += `<div style="display: table; width: 100%; border-spacing: 0 10px;">`
                for (const t of settingTasks) {
                    const tTime = new Date(t.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    const pName = t.project ? `${t.project.name}` : "Global"
                    htmlContent += `
                         <div style="display: table-row; background-color: #eff6ff; border-radius: 10px;">
                              <div style="display: table-cell; vertical-align: middle; padding: 14px; width: 60px; font-weight: 800; font-size: 12px; color: #1d4ed8; text-align: center; border-radius: 10px 0 0 10px;">${tTime}</div>
                              <div style="display: table-cell; vertical-align: middle; padding: 14px; border-left: 2px solid #60a5fa; border-radius: 0 10px 10px 0;">
                                   <div style="font-size: 14px; font-weight: 700; color: #1e3a8a; ${t.isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.title}</div>
                                   <div style="font-size: 11px; color: #64748b; margin-top: 2px;">📂 ${pName}</div>
                              </div>
                         </div>
                    `
                }
                htmlContent += `</div>`
            }

            try {
                await transporter.sendMail({
                    from: `"${setting.companyName}" <${setting.emailSmtpUser}>`,
                    to: targetEmail,
                    subject: `RESUMEN DIARIO: Tareas de Hoy`,
                    html: htmlContent
                })
            } catch (error) {
                console.error("Failed to send daily summary:", error)
            }
        }
    }
}

export async function testSmtpConnection() {
    const prismaLocal = new (await import('@prisma/client')).PrismaClient()
    const tenantId = await (await import("@/lib/tenant")).getTenantId()
    const setting = await prismaLocal.settings.findUnique({ where: { id: tenantId } })

    if (!setting || !setting.emailSmtpHost) throw new Error("SMTP no configurado en Ajustes")

    const targetEmail = setting.notificationEmail || setting.companyEmail

    if (!targetEmail) throw new Error("No hay email de destino configurado")

    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
        host: setting.emailSmtpHost || "smtp.example.com",
        port: setting.emailSmtpPort || 587,
        secure: setting.emailSmtpPort === 465,
        auth: {
            user: setting.emailSmtpUser || undefined,
            pass: setting.emailSmtpPass || undefined,
        },
    })

    await transporter.sendMail({
        from: `"${setting.companyName}" <${setting.emailSmtpUser}>`,
        to: targetEmail,
        subject: `PRUEBA SMTP CRM`,
        html: `<p>Hola,</p><p>Esta es una prueba de conexión SMTP del CRM.</p>`
    })
    
    return true
}

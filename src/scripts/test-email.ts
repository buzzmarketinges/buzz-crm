import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

async function testEmail() {
    console.log("Starting test email...")
    const settings = await prisma.settings.findFirst()
    
    if (!settings) {
        console.log("No settings found!")
        return
    }

    console.log("Notification email:", settings.notificationEmail)
    console.log("SMTP Host", settings.emailSmtpHost)
    console.log("SMTP Port", settings.emailSmtpPort)
    console.log("SMTP User", settings.emailSmtpUser)

    if (!settings.emailSmtpHost) {
        console.log("SMTP Host not set!")
        return
    }

    const transporter = nodemailer.createTransport({
        host: settings.emailSmtpHost,
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
            to: settings.notificationEmail || settings.companyEmail || "galos@example.com",
            subject: "PRUEBA SMTP CRM",
            html: "<p>Prueba de conexión SMTP exitosa.</p>"
        })
        console.log("Email sent successfully!")
    } catch (error) {
        console.error("Transporter Error:", error)
    } finally {
        await prisma.$disconnect()
    }
}

testEmail()

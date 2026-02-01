
'use server'

import prisma from "@/lib/prisma"
import { randomBytes } from "crypto"
import nodemailer from "nodemailer"
import bcrypt from "bcryptjs"

export async function requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
        return { success: true, message: "Si existe una cuenta con este email, recibirás un enlace de recuperación." }
    }

    const token = randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 3600000) // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: token,
            resetTokenExpiry: expiry
        }
    })

    const settings = await prisma.settings.findFirst()
    if (!settings?.emailSmtpHost) {
        return { success: false, message: "La configuración de email (SMTP) no está establecida en el sistema." }
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

    // Use environment variable or default to localhost
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    try {
        await transporter.sendMail({
            from: `"${settings.companyName}" <${settings.emailSmtpUser}>`,
            to: email,
            subject: "Recuperación de Contraseña - BuzzMarketing CRM",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Recuperación de Contraseña</h2>
                    <p>Hola ${user.name},</p>
                    <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
                    <p style="margin: 20px 0;">
                        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Restablecer Contraseña
                        </a>
                    </p>
                    <p>Si no has sido tú, ignora este mensaje.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">Este enlace expira en 1 hora.</p>
                </div>
            `
        })
        return { success: true, message: "Si existe una cuenta con este email, recibirás un enlace de recuperación." }
    } catch (error) {
        console.error("Error sending recovery email:", error)
        return { success: false, message: "Error al enviar el email. Verifica la configuración SMTP." }
    }
}

export async function resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: { gt: new Date() }
        }
    })

    if (!user) {
        return { success: false, message: "El enlace es inválido o ha expirado." }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
    })

    return { success: true, message: "Contraseña actualizada correctamente." }
}

'use server'

import prisma from "@/lib/prisma"
import nodemailer from "nodemailer"
import { revalidatePath } from "next/cache"
import { getTenantId } from "@/lib/tenant"

export async function getInvoiceEmailData(invoiceId: string) {
    const tenantId = await getTenantId()
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId, settingsId: tenantId },
        include: {
            company: {
                include: { contacts: true }
            },
            settings: true
        }
    })

    if (!invoice || !invoice.settings) throw new Error("Missing data")
    const settings = invoice.settings

    // Parse Subject
    let subject = settings.emailSubject || "Factura %numfactura%"
    subject = subject.replace(/%numfactura%/g, invoice.number)
    subject = subject.replace(/%nombreempresa%/g, invoice.company.businessName)

    // Parse Body
    let body = settings.emailBodyTemplate || "Adjunto encontrará su factura %numfactura%."
    body = body.replace(/%numfactura%/g, invoice.number)
    body = body.replace(/%nombreempresa%/g, invoice.company.businessName)
    body = body.replace(/%total%/g, Number(invoice.totalAmount).toFixed(2))

    // Collect all potential recipients
    // Default billing email + all contacts
    const contacts = invoice.company.contacts.map(c => ({
        email: c.email,
        name: c.name,
        role: c.role
    }))

    // Ensure billing email is in the list if not already
    const billingEmail = invoice.company.billingEmail
    const billingContactExists = contacts.some(c => c.email === billingEmail)

    const allContacts = [...contacts]
    if (!billingContactExists && billingEmail) {
        allContacts.unshift({
            email: billingEmail,
            name: invoice.company.businessName + " (Facturación)",
            role: "Principal"
        })
    }

    return {
        subject,
        body,
        contacts: allContacts,
        companyEmail: settings.companyEmail
    }
}

interface SendInvoiceOptions {
    recipients: string[]
    subject?: string
    body?: string
    bcc?: string[]
}

export async function sendInvoiceEmail(invoiceId: string, options?: SendInvoiceOptions) {
    const tenantId = await getTenantId()
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId, settingsId: tenantId },
        include: { company: true, settings: true }
    })

    if (!invoice || !invoice.settings) throw new Error("Missing data")
    const settings = invoice.settings

    // Use provided options or fallbacks (though UI should provide them)
    // If no options provided, use old behavior (default billing email, default templates)

    let subject = options?.subject
    if (!subject) {
        subject = settings.emailSubject || "Factura %numfactura%"
        subject = subject.replace(/%numfactura%/g, invoice.number)
        subject = subject.replace(/%nombreempresa%/g, invoice.company.businessName)
    }

    let body = options?.body
    if (!body) {
        body = settings.emailBodyTemplate || "Adjunto encontrará su factura %numfactura%."
        body = body.replace(/%numfactura%/g, invoice.number)
        body = body.replace(/%nombreempresa%/g, invoice.company.businessName)
        body = body.replace(/%total%/g, Number(invoice.totalAmount).toFixed(2))
    }

    const recipients = options?.recipients && options.recipients.length > 0
        ? options.recipients
        : [invoice.company.billingEmail]

    // Configure Transporter
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
        // Send Mail
        await transporter.sendMail({
            from: `"${settings.companyName}" <${settings.emailSmtpUser}>`, // sender address
            to: recipients.join(", "), // list of receivers
            bcc: options?.bcc?.join(", "), // blind copy
            subject: subject,
            html: body.replace(/\n/g, '<br>'),
            attachments: [
                {
                    filename: `Factura-${invoice.number}.pdf`,
                    path: invoice.pdfPath! // stream this file
                }
            ]
        })

        // Update Status to SENT
        // @ts-ignore
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: "SENT", lastError: null }
        })
    } catch (error: any) {
        console.error("Email send failed:", error)
        try {
            // Update Status to ERROR
            // @ts-ignore
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: "ERROR", lastError: error.message || "Error desconocido al enviar email" }
            })
        } catch (dbError) {
            console.error("Failed to update invoice error status", dbError)
        }
        throw error // Re-throw to UI
    }

    revalidatePath(`/invoices/${invoiceId}`)
}

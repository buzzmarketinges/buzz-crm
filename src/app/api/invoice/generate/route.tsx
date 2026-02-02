import { NextRequest, NextResponse } from "next/server"
import os from "os"
import prisma from "@/lib/prisma"
import { InvoicePDF } from "@/components/pdf/InvoicePDF"
import { renderToStream } from "@react-pdf/renderer"
import fs from "fs"
import path from "path"
import { getTenantId } from "@/lib/tenant"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const companyId = formData.get("companyId") as string
        const itemsJson = formData.get("items") as string
        const items = JSON.parse(itemsJson)

        // 1. Fetch Company & Settings
        const tenantId = await getTenantId()
        const company = await prisma.company.findUnique({ where: { id: companyId } })
        const settings = await prisma.settings.findUnique({ where: { id: tenantId } })

        if (!company || !settings) {
            return NextResponse.json({ error: "Company or Settings not found" }, { status: 404 })
        }

        console.log("Generating Invoice. Settings Simulated Date:", settings.simulatedDate)

        // 2. Calculate next invoice number
        // Format: "PREFIX-NUMBER" e.g "26-02" if prefix is "26-" and next is 2
        // User Example: "26-02". Prefix "26-", counter 02.

        // Use simulated date or today for year calculation
        const issueDate = settings.simulatedDate ? new Date(settings.simulatedDate) : new Date()

        let prefix = settings.invoicePrefix

        // Replace variables
        const year = issueDate.getFullYear()
        const yearShort = year.toString().slice(-2)

        prefix = prefix.replace(/%yyyy%/g, year.toString())
        prefix = prefix.replace(/%yy%/g, yearShort)

        const numberStr = settings.invoiceNextNumber.toString().padStart(2, '0')
        const invoiceFullNumber = `${prefix}${numberStr}`

        // 3. Prepare Data
        // issueDate is already calculated above
        console.log("Invoice Issue Date Determining:", issueDate)

        const subtotal = items.reduce((acc: number, item: any) => {
            const price = Number(item.price)
            const discount = Number(item.discount || 0)
            const finalPrice = discount > 0 ? price * ((100 - discount) / 100) : price
            return acc + finalPrice
        }, 0)

        // Calculate Taxes
        let taxAmount = 0
        let withholdingAmount = 0
        const taxRate = settings.taxEnabled ? Number(settings.taxRate) : 0
        const withholdingRate = settings.withholdingEnabled ? Number(settings.withholdingRate) : 0

        if (settings.taxEnabled) {
            taxAmount = subtotal * (taxRate / 100)
        }

        if (settings.withholdingEnabled) {
            withholdingAmount = subtotal * (withholdingRate / 100)
        }

        const total = subtotal + taxAmount - withholdingAmount

        let invoiceLocalPathDir = settings.localSavePath

        // Use project directory/invoices as default if no path is configured
        if (!invoiceLocalPathDir || invoiceLocalPathDir.trim() === '') {
            invoiceLocalPathDir = path.join(process.cwd(), 'invoices')
        }

        // Ensure dir exists (recursively)
        if (!fs.existsSync(invoiceLocalPathDir)) {
            try {
                await fs.promises.mkdir(invoiceLocalPathDir, { recursive: true })
            } catch (err) {
                console.error(`Failed to create directory: ${invoiceLocalPathDir}`, err)
                // Fallback to system temp dir (works in Vercel)
                invoiceLocalPathDir = path.join(os.tmpdir(), 'buzz-crm-invoices')
                if (!fs.existsSync(invoiceLocalPathDir)) {
                    await fs.promises.mkdir(invoiceLocalPathDir, { recursive: true })
                }
            }
        }
        const filename = `Factura_${invoiceFullNumber}_${company.businessName.replace(/[^a-z0-9]/gi, '_')}.pdf`
        const fullPath = path.join(invoiceLocalPathDir, filename)

        // Load Logo
        let logoBase64 = undefined;
        try {
            const logoPath = path.join(process.cwd(), 'public', 'invoice-logo.png');
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn("Failed to load invoice logo", e);
        }

        const pdfData = {
            number: invoiceFullNumber,
            date: issueDate.toLocaleDateString('es-ES'),
            logoBase64: logoBase64,
            company: {
                name: company.name,
                businessName: company.businessName,
                cif: company.taxId,
                address: company.address || ""
            },
            items: items.map((i: any) => ({
                description: i.name,
                price: Number(i.price),
                discount: Number(i.discount || 0)
            })),
            subtotal: subtotal,
            taxRate: taxRate,
            taxAmount: taxAmount,
            withholdingRate: withholdingRate,
            withholdingAmount: withholdingAmount,
            total: total,
            settings: {
                companyName: settings.companyName,
                commercialName: settings.commercialName || undefined,
                companyAddress: settings.companyAddress || "",
                companyEmail: settings.companyEmail || "",
                companyTaxId: settings.companyTaxId || "",
                taxIdLabel: settings.taxIdLabel || "EIN",
                bankBeneficiary: settings.bankBeneficiary || "",
                bankIban: settings.bankIban || "",
                bankName: settings.bankName || "",
                bankAddress: settings.bankAddress || "",
                bankSwift: settings.bankSwift || ""
            }
        }

        // 4. Create DB Record (Draft/Sent?) -> Created
        // Create Invoice with items snapshot
        const invoice = await prisma.invoice.create({
            data: {
                number: invoiceFullNumber,
                companyId: company.id,
                status: "CREATED",
                subtotal: subtotal,
                taxRate: taxRate,
                taxAmount: taxAmount,
                withholdingRate: withholdingRate,
                withholdingAmount: withholdingAmount,
                totalAmount: total,
                items: JSON.stringify(items),
                pdfPath: fullPath,
                issueDate: issueDate,
                settingsId: settings.id // Use settings.id explicitly which is the tenant id
            }
        })

        // 5. Update Services (Last Billed At)
        // Only update if serviceId is present in items (which it is from our dashboard logic)
        const serviceIds = items.map((i: any) => i.serviceId).filter(Boolean)
        if (serviceIds.length > 0) {
            await prisma.service.updateMany({
                where: { id: { in: serviceIds } },
                data: { lastBilledAt: issueDate }
            })
        }

        // 6. Update Settings (Increment Counter)
        await prisma.settings.update({
            where: { id: settings.id },
            data: { invoiceNextNumber: { increment: 1 } }
        })

        // 7. Render & Save PDF
        // @react-pdf/renderer renderToStream is async
        const stream = await renderToStream(<InvoicePDF data={pdfData} />)
        const writeStream = fs.createWriteStream(fullPath)

        // Pipe stream to file
        // We need to wait for finish
        await new Promise<void>((resolve, reject) => {
            stream.pipe(writeStream)
            writeStream.on('finish', resolve)
            writeStream.on('error', reject)
        })

        // 8. Redirect to Invoice View (or send Success response)
        // Since this was a Form POST, we should return a redirect
        // Use NextResponse.redirect
        const url = new URL(`/invoices`, req.url) // List of invoices?
        // Or actually specific invoice?
        // Let's redirect to Billing for now with success? Or Invoices list.
        // User wants "Actions Post-Generation: 1. Save PDF 2. Button to 'Send by Email'"
        // So the best next screen is the "Invoice Detail / Preview" screen which has the "Send Email" button.
        // I haven't built Invoice Detail yet. I built Client Invoice list? No.
        // I should build `src/app/invoices/[id]/page.tsx`
        return NextResponse.redirect(new URL(`/invoices/${invoice.id}`, req.url))

    } catch (error) {
        console.error("Invoice Generation Error:", error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

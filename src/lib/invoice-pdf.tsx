import prisma from "@/lib/prisma"
import fs from "fs"
import path from "path"
import { InvoicePDF } from "@/components/pdf/InvoicePDF"
import { renderToStream } from "@react-pdf/renderer"

export async function generateInvoicePdfBuffer(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            company: true,
            settings: true
        }
    })

    if (!invoice) {
        throw new Error("Invoice not found")
    }

    // Load Logo if exists
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

    // Parse items
    const items = JSON.parse(invoice.items)

    // Prepare data for PDF component
    const pdfData = {
        number: invoice.number,
        date: invoice.issueDate.toLocaleDateString('es-ES'),
        logoBase64: logoBase64,
        company: {
            name: invoice.company.name,
            businessName: invoice.company.businessName,
            cif: invoice.company.taxId,
            address: invoice.company.address || ""
        },
        items: items.map((i: any) => ({
            description: i.description || i.name, // Handle possible property names from legacy or generation
            price: Number(i.price),
            discount: Number(i.discount || 0)
        })),
        subtotal: Number(invoice.subtotal),
        taxRate: Number(invoice.taxRate),
        taxAmount: Number(invoice.taxAmount),
        withholdingRate: Number(invoice.withholdingRate),
        withholdingAmount: Number(invoice.withholdingAmount),
        total: Number(invoice.totalAmount),
        settings: {
            companyName: invoice.settings.companyName,
            commercialName: invoice.settings.commercialName || undefined,
            companyAddress: invoice.settings.companyAddress || " ",
            companyEmail: invoice.settings.companyEmail || "",
            companyTaxId: invoice.settings.companyTaxId || " ",
            taxIdLabel: invoice.settings.taxIdLabel || "EIN",
            bankBeneficiary: invoice.settings.bankBeneficiary || "",
            bankIban: invoice.settings.bankIban || "",
            bankName: invoice.settings.bankName || "",
            bankAddress: invoice.settings.bankAddress || "",
            bankSwift: invoice.settings.bankSwift || ""
        }
    }

    // Render PDF to stream
    const stream = await renderToStream(<InvoicePDF data={pdfData} />)

    // Convert stream to Buffer
    const chunks: any[] = []
    for await (const chunk of stream as any) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

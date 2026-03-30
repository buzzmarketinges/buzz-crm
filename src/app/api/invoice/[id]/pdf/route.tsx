import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const invoice = await prisma.invoice.findUnique({
            where: { id: id }
        })

        if (!invoice) {
            return new NextResponse("Invoice not found", { status: 404 })
        }

        const fileBuffer = await generateInvoicePdfBuffer(invoice.id)
        const filename = `${invoice.number}.pdf`

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        })

    } catch (error) {
        console.error("PDF Download Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

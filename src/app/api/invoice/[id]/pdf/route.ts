import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import fs from "fs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const invoice = await prisma.invoice.findUnique({
            where: { id: id }
        })

        if (!invoice || !invoice.pdfPath) {
            return new NextResponse("Invoice not found or PDF missing", { status: 404 })
        }

        if (!fs.existsSync(invoice.pdfPath)) {
            return new NextResponse("PDF File not found on server disk", { status: 404 })
        }

        const fileBuffer = fs.readFileSync(invoice.pdfPath)

        // Extract filename from path
        // User requested ONLY invoice number as filename
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

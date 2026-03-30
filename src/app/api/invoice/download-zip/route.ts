import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getTenantId } from "@/lib/tenant"
import fs from "fs"
import JSZip from "jszip"
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf"


export async function POST(req: NextRequest) {
    try {
        const { startDate, endDate, clientId } = await req.json()
        const tenantId = await getTenantId()

        const where: any = {
            settingsId: tenantId,
            // Assuming we only download "Active" invoices or "All"? 
            // Usually if filtering by date, we might want ALL generated invoices even if archived?
            // But let's assume we want generated invoices (meaning they have a PDF).
            status: { not: 'DRAFT' }, // Drafts might not have PDFs? Actually my system generates PDF on creation? Yes.
            // But usually drafts shouldn't be distributed.
        }

        if (startDate) {
            where.issueDate = { ...where.issueDate, gte: new Date(startDate) }
        }
        if (endDate) {
            // Include the end date fully (end of day) if it's just a date string
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            where.issueDate = { ...where.issueDate, lte: end }
        }
        if (clientId && clientId !== 'all') {
            where.companyId = clientId
        }

        const invoices = await prisma.invoice.findMany({
            where,
            select: {
                id: true,
                number: true,
                pdfPath: true
            }
        })

        if (invoices.length === 0) {
            return new NextResponse(JSON.stringify({ error: "No se encontraron facturas en el periodo seleccionado" }), { status: 404 })
        }

        const zip = new JSZip()
        let addedCount = 0

        for (const inv of invoices) {
            try {
                // Try to use the utility which handles regeneration
                const content = await generateInvoicePdfBuffer(inv.id)
                zip.file(`${inv.number}.pdf`, content)
                addedCount++
            } catch (err) {
                console.error(`Failed to add invoice ${inv.number} to ZIP:`, err)
            }
        }

        if (addedCount === 0) {
            return new NextResponse(JSON.stringify({ error: "No se pudieron generar los archivos PDF para las facturas seleccionadas" }), { status: 404 })
        }


        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

        return new NextResponse(zipBuffer as any, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="facturas.zip"`
            }
        })

    } catch (error) {
        console.error("ZIP Generation Error:", error)
        return new NextResponse(JSON.stringify({ error: "Error interno al generar ZIP" }), { status: 500 })
    }
}
